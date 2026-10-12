"""Image lock, backup corruption and legacy frontend build regression checks."""

import argparse
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('runtime_images', ROOT / 'scripts/runtime_images.py')
IMAGES = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(IMAGES)
LOCK = json.loads(IMAGES.LOCK.read_text())


class RuntimeImagesTest(unittest.TestCase):
    def test_compose_and_build_defaults_match_lock(self):
        compose = (ROOT / 'docker/jitsi-core/docker-compose.yml').read_text()
        for service in ('web', 'prosody', 'jicofo', 'jvb'):
            self.assertIn('image: ' + LOCK['images'][service]['reference'], compose)
        ref = LOCK['images']['web']['reference']
        self.assertIn('ARG JITSI_WEB_IMAGE=' + ref,
                      (ROOT / 'docker/jitsi-core/web/Dockerfile.local').read_text())
        self.assertIn('JITSI_WEB_IMAGE: ' + ref,
                      (ROOT / 'docker/jitsi-core/docker-compose.local-web.yml').read_text())

    def test_legacy_and_current_dockerfiles_use_locked_base(self):
        with tempfile.TemporaryDirectory() as directory:
            source, output = Path(directory) / 'source', Path(directory) / 'output'
            for base in ('${JITSI_IMAGE_REPO}/web:${JITSI_IMAGE_VERSION}', '${JITSI_WEB_IMAGE}'):
                source.write_text('FROM ' + base + '\nCOPY libs/ /app/\n')
                IMAGES.web_dockerfile(argparse.Namespace(source=source, output=output), LOCK)
                self.assertEqual(output.read_text(), 'FROM ' + LOCK['images']['web']['reference'] + '\nCOPY libs/ /app/\n')
            source.write_text('FROM unreviewed:latest\n')
            with self.assertRaises(ValueError):
                IMAGES.web_dockerfile(argparse.Namespace(source=source, output=output), LOCK)

    def test_docker_and_podman_ids_normalized(self):
        for value in ('a' * 64, 'sha256:' + 'a' * 64):
            with patch.object(IMAGES, 'run', return_value=value):
                self.assertEqual(IMAGES.inspect_id('docker', 'test'), 'sha256:' + 'a' * 64)

    def fixture_backup(self, directory):
        records = []
        for service, source in LOCK['images'].items():
            archive = directory / (service + '.tar')
            archive.write_bytes(b'fixture archive')
            image_id = source['platforms']['linux/amd64']['image_id']
            records.append({'service': service, 'source': source['reference'],
                            'image_id': image_id,
                            'tag': f'localhost/watchparty-pinned/{service}:{image_id[7:23]}',
                            'archive': archive.name, 'sha256': IMAGES.file_sha(archive)})
        metadata = {'platform': 'linux/amd64', 'images': records}
        (directory / 'backup.json').write_text(json.dumps(metadata))
        return metadata

    def test_corrupt_or_incomplete_backup_rejected_before_load(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            metadata = self.fixture_backup(directory)
            with contextlib.redirect_stdout(io.StringIO()):
                IMAGES.verify(directory, LOCK)
            (directory / 'web.tar').write_bytes(b'corrupt')
            with patch.object(IMAGES, 'run') as run:
                with self.assertRaisesRegex(ValueError, 'Corrupt'):
                    IMAGES.restore(argparse.Namespace(directory=directory, engine='docker'), LOCK)
                run.assert_not_called()
            metadata['images'].pop()
            (directory / 'backup.json').write_text(json.dumps(metadata))
            with self.assertRaisesRegex(ValueError, 'incomplete'):
                IMAGES.verify(directory, LOCK)

    def test_restore_does_not_replace_custom_frontend(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            metadata = self.fixture_backup(directory)
            ids = {record['tag']: record['image_id'] for record in metadata['images']}
            with patch.object(IMAGES, 'run'), patch.object(IMAGES, 'inspect_id', side_effect=lambda _, tag: ids[tag]), contextlib.redirect_stdout(io.StringIO()):
                IMAGES.restore(argparse.Namespace(directory=directory, engine='docker'), LOCK)
            override = (directory / 'compose.offline.yml').read_text()
            self.assertNotIn('    web:', override)
            self.assertEqual(override.count('pull_policy: never'), 4)


if __name__ == '__main__':
    unittest.main()
