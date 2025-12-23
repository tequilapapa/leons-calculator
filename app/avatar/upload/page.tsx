'use client';

import { PutBlobResult } from '@vercel/blob';

import { useState, useRef } from 'react';

export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  return (
    <>
<div className="mt-6 space-y-3">
  <p className="text-sm text-neutral-600">
    Like what you see? Get a free in-home estimate and lock in this price
    range with a flooring specialist.
  </p>

  <button
    onClick={() => {
      const form = document.getElementById("quote-form");
      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }}
    className="w-full md:w-auto px-6 py-3 rounded-full text-sm font-semibold shadow-md"
  >
    Get my free in-home estimate
  </button>
</div>

      <h1>Upload Your Avatar</h1>
<section id="quote-form">
async function handleSubmit(e) {
  e.preventDefault();

  const data = {
    name,
    email,
    phone,
    zip,
    estimateSummary, // e.g. "~450 sq ft • European oak • $7–9 / sq ft"
    imageUrl,        // from the camera flow, if you’re already storing it
  };

  await fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  // show thank-you, redirect, etc.
}

<button
  onClick={() => {
    const form = document.getElementById("quote-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }}
  className="px-4 py-2 rounded-full text-sm font-medium shadow-md"
>
  See this in my floors
</button>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          if (!inputFileRef.current?.files) {
            throw new Error("No file selected");
          }

          const file = inputFileRef.current.files[0];

          const response = await fetch(
            `/api/avatar/upload?filename=${file.name}`,
            {
              method: 'POST',
              body: file,
            },
          );

          const newBlob = (await response.json()) as PutBlobResult;

          setBlob(newBlob);
        }}
      >
        <input name="file" ref={inputFileRef} type="file" accept="image/jpeg, image/png, image/webp" required />
        <button type="submit">Upload</button>
      </form>
import Link from "next/link";

<button className="px-4 py-2 rounded-full text-sm font-medium shadow-md">
  <Link href="https://www.leonshardwood.com/book-online">
    See this in my floors
  </Link>
</button>

      {blob && (
        <div>
          Blob url: <a href={blob.url}>{blob.url}</a>
        </div>
      )}
    </>
  );
}