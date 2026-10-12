#!/usr/bin/env python3
"""Pin official images and retain/restore verified, offline Docker archives."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / 'docker/jitsi-core/images.lock.json'
MEDIA_TYPES = ', '.join([
    'application/vnd.oci.image.index.v1+json',
    'application/vnd.docker.distribution.manifest.list.v2+json',
    'application/vnd.oci.image.manifest.v1+json',
    'application/vnd.docker.distribution.manifest.v2+json',
])


def file_sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def registry_manifest(repository, reference):
    query = urllib.parse.urlencode({
        'service': 'registry.docker.io', 'scope': f'repository:{repository}:pull'})
    with urllib.request.urlopen('https://auth.docker.io/token?' + query, timeout=60) as response:
        token = json.load(response)['token']
    request = urllib.request.Request(
        f'https://registry-1.docker.io/v2/{repository}/manifests/{reference}',
        headers={'Authorization': f'Bearer {token}', 'Accept': MEDIA_TYPES})
    with urllib.request.urlopen(request, timeout=60) as response:
        body = response.read()
        digest = 'sha256:' + hashlib.sha256(body).hexdigest()
        if response.headers.get('Docker-Content-Digest', digest) != digest:
            raise ValueError('Registry manifest digest mismatch')
    if reference.startswith('sha256:') and reference != digest:
        raise ValueError('Registry returned a different manifest')
    return digest, json.loads(body)


def resolve(lock_path=LOCK):
    if lock_path.exists():
        raise ValueError('Lock already exists; review an explicit replacement instead of refreshing tags automatically')
    images = {}
    for service in ('web', 'prosody', 'jicofo', 'jvb', 'caddy'):
        repository = 'library/caddy' if service == 'caddy' else f'jitsi/{service}'
        tag = '2-alpine' if service == 'caddy' else 'stable-10978'
        digest, index = registry_manifest(repository, tag)
        platforms = {}
        for descriptor in index.get('manifests', []):
            platform = descriptor.get('platform', {})
            if platform.get('os') != 'linux' or platform.get('architecture') not in ('amd64', 'arm64'):
                continue
            key = 'linux/' + platform['architecture']
            child_digest, child = registry_manifest(repository, descriptor['digest'])
            platforms[key] = {'manifest': child_digest, 'image_id': child['config']['digest']}
        if not {'linux/amd64', 'linux/arm64'} <= platforms.keys():
            raise ValueError(f'{service} lacks supported platforms')
        images[service] = {'source_tag': f'docker.io/{repository}:{tag}',
                           'reference': f'docker.io/{repository}@{digest}', 'platforms': platforms}
        print(service, digest, flush=True)
    lock_path.write_text(json.dumps({'schema_version': 1, 'images': images}, indent=2) + '\n')


def run(engine, *args, capture=False):
    result = subprocess.run([engine, *args], check=True, text=True,
                            stdout=subprocess.PIPE if capture else None)
    return result.stdout.strip() if capture else None


def inspect_id(engine, reference):
    value = run(engine, 'image', 'inspect', '--format', '{{.Id}}', reference, capture=True)
    return value if value.startswith('sha256:') else 'sha256:' + value


def backup(args, lock):
    args.directory.mkdir(parents=True, exist_ok=True)
    (args.directory / 'images.lock.json').write_text(json.dumps(lock, indent=2) + '\n')
    metadata_path = args.directory / 'backup.json'
    records = []
    for service, source in lock['images'].items():
        platform = source['platforms'][args.platform]
        image_id = platform['image_id']
        ref = source['reference'].split('@')[0] + '@' + platform['manifest']
        tag = f'localhost/watchparty-pinned/{service}:{image_id[7:23]}'
        archive = args.directory / f'{service}-{image_id[7:23]}.tar'
        run(args.engine, 'pull', '--platform', args.platform, ref)
        if inspect_id(args.engine, ref) != image_id:
            raise ValueError(f'{service}: pulled image does not match lock')
        run(args.engine, 'tag', ref, tag)
        temporary = archive.with_suffix('.tar.partial')
        run(args.engine, 'save', '-o', str(temporary), tag)
        temporary.replace(archive)
        records.append({'service': service, 'source': source['reference'], 'tag': tag,
                        'image_id': image_id, 'archive': archive.name, 'sha256': file_sha(archive)})
        # Checkpoint completed archives so an interrupted download can be diagnosed.
        metadata_path.write_text(json.dumps({'schema_version': 1, 'platform': args.platform,
                                             'images': records}, indent=2) + '\n')
        print(f'Archived {service}: {archive}', flush=True)
    verify(args.directory, lock)


def verify(directory, lock):
    metadata = json.loads((directory / 'backup.json').read_text())
    records = metadata['images']
    if len(records) != len(lock['images']) or {r['service'] for r in records} != set(lock['images']):
        raise ValueError('Backup is incomplete or contains duplicate services')
    for record in records:
        source = lock['images'][record['service']]
        expected = source['platforms'][metadata['platform']]['image_id']
        expected_tag = f"localhost/watchparty-pinned/{record['service']}:{expected[7:23]}"
        if record['source'] != source['reference'] or record['image_id'] != expected or record['tag'] != expected_tag:
            raise ValueError('Backup does not match the committed image lock')
        name = record['archive']
        if Path(name).name != name or not re.fullmatch(r'[a-z0-9-]+\.tar', name):
            raise ValueError('Invalid archive path')
        if file_sha(directory / name) != record['sha256']:
            raise ValueError(f'Corrupt archive: {name}')
    print(f"Verified {len(records)} archives for {metadata['platform']}")
    return records


def restore(args, lock):
    records = verify(args.directory, lock)  # Verify every archive before loading any.
    for record in records:
        run(args.engine, 'load', '-i', str(args.directory / record['archive']))
        if inspect_id(args.engine, record['tag']) != record['image_id']:
            raise ValueError(f"Restored image ID mismatch: {record['service']}")
    lines = ['# Apply LAST, after the production/custom web override.', 'services:']
    for record in records:
        if record['service'] == 'web':
            continue  # Never replace the customized Watch Party frontend with upstream web.
        lines += [f"    {record['service']}:", f"        image: {record['tag']}", '        pull_policy: never']
    (args.directory / 'compose.offline.yml').write_text('\n'.join(lines) + '\n')
    print('Restored image IDs verified. Offline backend override: ' + str(args.directory / 'compose.offline.yml'))
    print('The custom Watch Party web image must be retained/restored separately.')


def web_dockerfile(args, lock):
    """Pin the base even when SOURCE_DIR is a checkout predating the image lock."""
    if args.source is None or args.output is None:
        raise ValueError('web-dockerfile requires --source and --output')
    text = args.source.read_text()
    expected = ('FROM ${JITSI_IMAGE_REPO}/web:${JITSI_IMAGE_VERSION}', 'FROM ${JITSI_WEB_IMAGE}')
    lines = text.splitlines()
    from_lines = [line for line in lines if line.startswith('FROM ')]
    if len(from_lines) != 1 or from_lines[0] not in expected:
        raise ValueError('Unrecognized web Dockerfile base; review before building')
    text = text.replace(from_lines[0], 'FROM ' + lock['images']['web']['reference'])
    args.output.write_text(text)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['resolve', 'backup', 'verify', 'restore', 'web-dockerfile'])
    parser.add_argument('--source', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--lock', type=Path, default=LOCK)
    parser.add_argument('--directory', type=Path, default=ROOT / '.runtime-images/stable-10978-linux-amd64')
    parser.add_argument('--platform', choices=['linux/amd64', 'linux/arm64'], default='linux/amd64')
    parser.add_argument('--engine', default=os.environ.get('CONTAINER_ENGINE', 'docker'))
    args = parser.parse_args()
    if args.command == 'resolve':
        resolve(args.lock)
        return
    lock = json.loads(args.lock.read_text())
    if args.command == 'backup':
        backup(args, lock)
    elif args.command == 'verify':
        verify(args.directory, lock)
    elif args.command == 'web-dockerfile':
        web_dockerfile(args, lock)
    else:
        restore(args, lock)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        print(f'Error: {error}', file=sys.stderr)
        sys.exit(1)
