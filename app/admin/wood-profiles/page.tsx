// app/admin/wood-profiles/page.tsx
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WoodProfile = {
  id?: string;
  name: string;
  description: string | null;
  image_url: string;
  texture_url: string | null;
  price_per_sqft: number;
  color: string | null;
  wood_type: string;
  finish: string | null;
  created_at?: string;
};

type CsvRow = Omit<WoodProfile, "id" | "created_at">;

export default function WoodProfilesAdminPage() {
  const [profiles, setProfiles] = useState<WoodProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvInfo, setCsvInfo] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing wood_profiles from Supabase
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("wood_profiles")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          console.error(error);
          setError(error.message);
          return;
        }

        setProfiles((data as WoodProfile[]) ?? []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Naive CSV parser (assumes no commas inside fields)
  const handleCsvChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    setCsvRows([]);
    setCsvInfo(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setError("CSV seems empty or has no data rows.");
      return;
    }

    const headerLine = lines[0];
    const headers = headerLine.split(",").map((h) => h.trim());

    const idx = (name: string) => headers.indexOf(name);

    const iName = idx("name");
    const iDescription = idx("description");
    const iImageUrl = idx("image_url");
    const iTextureUrl = idx("texture_url");
    const iPrice = idx("price_per_sqft");
    const iColor = idx("color");
    const iWoodType = idx("wood_type");
    const iFinish = idx("finish");

    const required = { iName, iImageUrl, iPrice, iWoodType };
    for (const [key, value] of Object.entries(required)) {
      if (value === -1) {
        setError(
          `CSV is missing required column: ${
            key.replace(/^i/, "").toLowerCase() // ugly but fine
          }`
        );
        return;
      }
    }

    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const cols = line.split(",").map((c) => c.trim());

      const row: CsvRow = {
        name: cols[iName],
        description: iDescription >= 0 ? cols[iDescription] || null : null,
        image_url: cols[iImageUrl],
        texture_url: iTextureUrl >= 0 ? cols[iTextureUrl] || null : null,
        price_per_sqft: Number(cols[iPrice] || "0"),
        color: iColor >= 0 ? (cols[iColor] || null) : null,
        wood_type: cols[iWoodType],
        finish: iFinish >= 0 ? cols[iFinish] || null : null,
      };

      rows.push(row);
    }

    setCsvRows(rows);
    setCsvInfo(
      `Parsed ${rows.length} rows from "${file.name}". Ready to import.`
    );
  };

  const handleImport = async () => {
    if (csvRows.length === 0) {
      setError("No CSV data loaded.");
      return;
    }

    setError(null);
    setSuccess(null);
    setImporting(true);

    try {
      const res = await fetch("/api/upload-wood-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: csvRows }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Import failed with status ${res.status}`);
      }

      const body = await res.json();
      setSuccess(`Imported ${body.inserted ?? csvRows.length} wood profiles.`);
      // Reload from Supabase
      const supabase = createClient();
      const { data, error } = await supabase
        .from("wood_profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        setError(error.message);
        return;
      }

      setProfiles((data as WoodProfile[]) ?? []);
      setCsvRows([]);
      setCsvInfo(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Wood Profiles Admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload your CSV to seed <code>public.wood_profiles</code> and review
          everything the camera app will use.
        </p>
      </header>

      {/* CSV Upload Card */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv">Import wood profiles from CSV</Label>
          <Input
            id="csv"
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvChange}
          />
          <p className="text-xs text-muted-foreground">
            Expected columns:{" "}
            <code>
              name, description, image_url, texture_url, price_per_sqft, color,
              wood_type, finish
            </code>
          </p>
        </div>

        {csvInfo && (
          <p className="text-sm text-emerald-600 font-medium">{csvInfo}</p>
        )}
        {csvRows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            First profile: <strong>{csvRows[0].name}</strong> –{" "}
            {csvRows[0].wood_type} @ ${csvRows[0].price_per_sqft.toFixed(2)} /
            sqft
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleImport}
            disabled={importing || csvRows.length === 0}
          >
            {importing ? "Importing…" : "Import into Supabase"}
          </Button>
          {success && (
            <span className="text-xs text-emerald-600 font-semibold">
              {success}
            </span>
          )}
          {error && (
            <span className="text-xs text-red-600 font-semibold">{error}</span>
          )}
        </div>
      </Card>

      {/* Existing Profiles */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Existing wood profiles</h2>
          <span className="text-xs text-muted-foreground">
            {loading ? "Loading…" : `${profiles.length} profiles`}
          </span>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Finish</th>
                <th className="px-3 py-2 text-right">$/sqft</th>
                <th className="px-3 py-2 text-left">Color</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.wood_type}</td>
                  <td className="px-3 py-2">{p.finish ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    ${p.price_per_sqft.toFixed(2)}
                  </td>
                  <td className="px-3 py-2">{p.color ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}

              {!loading && profiles.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-muted-foreground text-sm"
                  >
                    No wood profiles yet. Import a CSV above to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}