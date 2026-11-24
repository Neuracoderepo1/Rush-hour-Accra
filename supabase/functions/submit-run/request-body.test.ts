import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { readBoundedUtf8Body } from "./request-body.ts";

Deno.test("accepts a body exactly at the byte limit", async () => {
  const body = new TextEncoder().encode('{"score":1}');
  assertEquals(await readBoundedUtf8Body(
    new Response(body).body,
    body.byteLength,
  ), '{"score":1}');
});

Deno.test("rejects oversized chunked bodies without buffering the remainder", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(1024));
      controller.enqueue(new Uint8Array(1025));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assertRejects(
    () => readBoundedUtf8Body(body, 2048),
    RangeError,
    "payload_too_large",
  );
  assertEquals(cancelled, true);
});

Deno.test("decodes UTF-8 split across chunks", async () => {
  const bytes = new TextEncoder().encode("Accra 🚗");
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, 7));
      controller.enqueue(bytes.slice(7));
      controller.close();
    },
  });
  assertEquals(await readBoundedUtf8Body(body, 64), "Accra 🚗");
});

Deno.test("rejects malformed UTF-8", async () => {
  const body = new Response(new Uint8Array([0xc3, 0x28])).body;
  await assertRejects(
    () => readBoundedUtf8Body(body, 8),
    TypeError,
  );
});
