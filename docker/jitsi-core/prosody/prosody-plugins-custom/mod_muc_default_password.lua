-- Locks every room on this MUC component with a fixed password before the
-- creating occupant's own join is processed, so a room is never reachable
-- password-free - including by its own creator.
--
-- muc-room-created only fires after the creator has already joined (Prosody's
-- room_mt:handle_first_presence runs muc-occupant-pre-join - where the core
-- password check lives - before it fires muc-room-created), so setting the
-- password there would leave the very first join unprotected. muc-room-pre-create
-- fires at the start of that same function, before the password check runs for
-- anyone, so the creator is held to the passphrase too.
--
-- Enable via XMPP_MUC_MODULES=muc_default_password and set WATCHPARTY_ROOM_PASSWORD
-- in the environment.

local default_password = os.getenv("WATCHPARTY_ROOM_PASSWORD");

if not default_password or default_password == "" then
	module:log("warn", "WATCHPARTY_ROOM_PASSWORD is not set - rooms will NOT get a default password");
else
	module:hook("muc-room-pre-create", function (event)
		local room = event.room;

		room:set_password(default_password);
		module:log("info", "Locked newly created room %s with the default password", room.jid);
	end);
end
