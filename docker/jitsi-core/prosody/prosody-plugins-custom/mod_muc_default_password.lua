-- Locks every room on this MUC component with a fixed password as soon as it is
-- created (muc-room-created fires before the occupant that triggered creation
-- actually joins), so a room is never reachable password-free.
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
