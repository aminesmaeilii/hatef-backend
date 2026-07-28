import { describe, expect, it } from "vitest";
import { sniffMimeType } from "./magic-byte";

describe("sniffMimeType", () => {
  it("recognizes a PNG signature", () => {
    expect(sniffMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]))).toBe("image/png");
  });

  it("recognizes a JPEG signature", () => {
    expect(sniffMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("image/jpeg");
  });

  it("recognizes a WEBP signature", () => {
    const buffer = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]);
    expect(sniffMimeType(buffer)).toBe("image/webp");
  });

  it("recognizes a PDF signature", () => {
    expect(sniffMimeType(Buffer.from("%PDF-1.7 rest of file"))).toBe("application/pdf");
  });

  it("rejects an unrecognized or spoofed extension", () => {
    // A .png-named file whose actual bytes are plain text should not sniff as an image.
    expect(sniffMimeType(Buffer.from("just some plain text content"))).toBeNull();
  });

  it("rejects an empty buffer", () => {
    expect(sniffMimeType(Buffer.alloc(0))).toBeNull();
  });
});
