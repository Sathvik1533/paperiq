-- PaperIQ Seed Data

INSERT INTO colleges (id, name, short_name, portal_url, scraper_type)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'MLR Institute of Technology',
  'MLRIT',
  'https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html',
  'mlrit'
) ON CONFLICT (short_name) DO NOTHING;

INSERT INTO branches (id, college_id, name, short_name)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Computer Science Engineering', 'CSE'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Information Technology', 'IT')
ON CONFLICT (college_id, short_name) DO NOTHING;

INSERT INTO subjects (id, college_id, name, code, semester, year, regulation)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Discrete Mathematics', 'A6CS08', 1, 2, 'R22'
);

INSERT INTO subject_branch_map (subject_id, branch_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO paper_sources (id, college_id, name, base_url, scraper_config)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'MLRIT Old QP Portal',
  'https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html',
  '{"archive_pattern": ".rar", "btech_year_prefix": "II-B.Tech"}'
);

INSERT INTO plans (id, name, price_inr, price_usd, features)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'Free', 0, 0,
  '{"analyses_per_month": 5, "colleges": 1, "export_pdf": false}'
);
