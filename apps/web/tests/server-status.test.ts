import { expect, test } from "bun:test";
import { parseServerEventBlock } from "../src/lib/server-events";
import {
  INITIAL_SERVER_STATUS,
  isServerAvailable,
  parseServerHello,
  parseServerNotice,
  serverAnnounced,
  serverGreeted,
  serverLossConfirmed,
  serverLost,
  serverReached,
} from "../src/lib/server-status";

const restart = { kind: "restart" as const, message: null, resumeInSeconds: 20, issuedAt: 1 };

test("reads an event block with its name and data", () => {
  expect(parseServerEventBlock('event: hello\ndata: {"bootId":"a"}')).toEqual({
    event: "hello",
    data: '{"bootId":"a"}',
  });
  expect(parseServerEventBlock(": keep-alive")).toBeNull();
});

test("rejects notices of an unknown kind and hellos without a boot id", () => {
  expect(parseServerNotice({ kind: "party", issuedAt: 1 })).toBeNull();
  expect(parseServerHello({ notice: null })).toBeNull();
  expect(
    parseServerHello({ bootId: "a", notice: { kind: "update", issuedAt: 2 } })?.notice,
  ).toEqual({ kind: "update", message: null, resumeInSeconds: null, issuedAt: 2 });
});

test("the first greeting is not a resume", () => {
  const status = serverGreeted(INITIAL_SERVER_STATUS, { bootId: "a", notice: null });
  expect(status.resumes).toBe(0);
  expect(isServerAvailable(status)).toBe(true);
});

test("an announced restart waits, then the new boot resumes once", () => {
  const online = serverGreeted(INITIAL_SERVER_STATUS, { bootId: "a", notice: null });
  const announced = serverLost(serverAnnounced(online, restart));
  expect(announced.phase).toBe("restarting");
  expect(isServerAvailable(announced)).toBe(false);
  expect(serverLossConfirmed(announced).phase).toBe("restarting");

  const stillStopping = serverGreeted(announced, { bootId: "a", notice: restart });
  expect(stillStopping.phase).toBe("restarting");
  expect(stillStopping.resumes).toBe(0);

  const back = serverGreeted(stillStopping, { bootId: "b", notice: null });
  expect(back.phase).toBe("online");
  expect(back.resumes).toBe(1);
  expect(back.resumedAt).not.toBeNull();
  expect(serverGreeted(back, { bootId: "b", notice: null }).resumedAt).toBe(back.resumedAt);
  expect(back.notice).toBeNull();
});

test("an unannounced loss becomes unreachable after the grace, and a silent restart still resumes", () => {
  const online = serverGreeted(INITIAL_SERVER_STATUS, { bootId: "a", notice: null });
  const lost = serverLost(online);
  expect(lost.phase).toBe("online");
  expect(isServerAvailable(lost)).toBe(false);
  expect(serverLossConfirmed(lost).phase).toBe("unreachable");

  const quick = serverGreeted(lost, { bootId: "b", notice: null });
  expect(quick.resumes).toBe(1);
  const sameProcess = serverGreeted(lost, { bootId: "a", notice: null });
  expect(sameProcess.resumes).toBe(0);
});

test("a stream that answers without a hello ends the loss once", () => {
  const online = serverGreeted(INITIAL_SERVER_STATUS, { bootId: "a", notice: null });
  const unreachable = serverLossConfirmed(serverLost(online));
  const reached = serverReached(unreachable);
  expect(reached.phase).toBe("online");
  expect(isServerAvailable(reached)).toBe(true);
  expect(reached.resumes).toBe(1);
  expect(serverReached(reached)).toBe(reached);
  expect(serverGreeted(reached, { bootId: "a", notice: null }).resumes).toBe(1);
});

test("an answer without a hello does not end an announced restart", () => {
  const online = serverGreeted(INITIAL_SERVER_STATUS, { bootId: "a", notice: null });
  const restarting = serverLost(serverAnnounced(online, restart));
  const reached = serverReached(restarting);
  expect(reached.phase).toBe("restarting");
  expect(reached.resumes).toBe(0);
});
