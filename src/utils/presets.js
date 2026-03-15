// ─── Scrape field presets ─────────────────────────────────────────────────────
export const PRESETS = [
  { label: "Blog",   fields: [{ name: "Title",    sel: "h1,h2" },                                   { name: "Author",   sel: ".author,.byline" },                  { name: "Date",     sel: "time,.date" },                       { name: "Link",     sel: "a[href]" }] },
  { label: "Job",    fields: [{ name: "Position", sel: "h1,h2,.job-title" },                         { name: "Company",  sel: ".company,[class*=company]" },         { name: "Location", sel: ".location,[class*=location]" },      { name: "Link",     sel: "a[href]" }] },
  { label: "Shop",   fields: [{ name: "Product",  sel: "h1,h2,[class*=title],[class*=name]" },       { name: "Price",    sel: "[class*=price]" },                    { name: "Rating",   sel: "[class*=rating]" },                  { name: "Image",    sel: "img" }] },
  { label: "News",   fields: [{ name: "Title",    sel: "h1,h2,h3,[class*=title]" },                  { name: "Category", sel: "[class*=category],[class*=tag]" },    { name: "Date",     sel: "time,[class*=date]" },               { name: "Excerpt",  sel: "p,[class*=excerpt]" }] },
  { label: "GitHub", fields: [{ name: "Repo",     sel: "h2 a,h3 a" },                               { name: "Desc",     sel: "p.col-9,.repo-description" },         { name: "Stars",    sel: "[href*=stargazers]" },               { name: "Link",     sel: "h2 a,h3 a" }] },
];
