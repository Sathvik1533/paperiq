-- Feedback table — passive emoji reactions + hours saved
-- rating:      1=bad 😕, 2=neutral 😐, 3=good 😊
-- hours_saved: "1–2 hours", "3–4 hours", etc. — becomes marketing data
-- trigger:     "timed" (5min) or "exit" (about to close tab)
-- page:        which feature — "analysis_results", "dashboard", etc.

create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  page        text not null,
  rating      smallint not null check (rating between 1 and 3),
  hours_saved text,           -- nullable — only from exit intent popup
  trigger     text,           -- "timed" | "exit"
  created_at  timestamptz default now()
);

create index if not exists feedback_page_idx    on feedback(page);
create index if not exists feedback_rating_idx  on feedback(rating);
create index if not exists feedback_created_idx on feedback(created_at);

alter table feedback enable row level security;

create policy "users can insert feedback"
  on feedback for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "service role reads all feedback"
  on feedback for select
  using (true);
