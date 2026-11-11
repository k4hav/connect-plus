import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getColleges = cache(async () => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("colleges").select("id, college_name").order("college_name");
    return (data ?? []) as { id: string; college_name: string }[];
  } catch {
    return [];
  }
});

export const getCategories = cache(async () => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("slug, label, is_active")
      .order("sort_order");
    return (data ?? []) as { slug: string; label: string; is_active: boolean }[];
  } catch {
    return [];
  }
});
