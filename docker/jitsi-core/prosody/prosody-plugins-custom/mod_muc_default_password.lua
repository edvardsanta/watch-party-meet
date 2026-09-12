-- Locks every room on this MUC component with a fixed password as soon as it
-- is created, so a room is never reachable password-free.
--
-- Deliberately hooks muc-room-created, not muc-room-pre-create: Prosody's own
-- muc/password.lib.lua also hooks muc-room-pre-create to read a password from
-- the *creating* occupant's own join stanza and unconditionally overwrite the
-- room's password with it (nil if absent). In this deployment the occupant
-- that actually creates the room (triggers handle_first_presence) is always
-- jicofo/focus - which is deliberately exempt from the password via
-- muc_password_whitelist and never sends one - so hooking pre-create races
-- with that core hook and gets the password reset back to nil right after
-- (or before) we set it, unlocking the room for everyone. muc-room-created
-- fires once that whole sequence (including jicofo's own join) has finished,
-- so setting the password here is the final word and reliably locks the room
-- for every subsequent (human) joiner.
--
-- Enable via XMPP_MUC_MODULES=muc_default_password and set WATCHPARTY_ROOM_PASSWORD
-- in the environment.

local default_password = os.getenv("WATCHPARTY_ROOM_PASSWORD");

if not default_password or default_password == "" then
	module:log("warn", "WATCHPARTY_ROOM_PASSWORD is not set - rooms will NOT get a default password");
else
	module:hook("muc-room-created", function (event)
		local room = event.room;

		room:set_password(default_password);
		module:log("info", "Locked newly created room %s with the default password", room.jid);
	end);
end
