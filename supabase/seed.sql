-- Seed data: well-known books, their film/series adaptations, and the links between them.

-- ============================================================
-- BOOKS
-- ============================================================
insert into books (id, title, author, isbn, page_count, published_date, description, cover_image_url, series_name, series_position) values
  ('a0000001-0000-0000-0000-000000000001', 'Dune', 'Frank Herbert', '9780441013593', 688, '1965-08-01', 'Set on the desert planet Arrakis, Dune is the story of Paul Atreides as he and his family accept control of the complete production of the most valuable substance in the universe.', 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg', 'Dune', 1),
  ('a0000001-0000-0000-0000-000000000002', 'The Lord of the Rings: The Fellowship of the Ring', 'J.R.R. Tolkien', '9780618640157', 423, '1954-07-29', 'The first volume of Tolkien''s epic fantasy masterpiece. A young hobbit is entrusted with an ancient ring and must embark on a quest to destroy it.', 'https://covers.openlibrary.org/b/isbn/9780618640157-L.jpg', 'The Lord of the Rings', 1),
  ('a0000001-0000-0000-0000-000000000003', 'Gone Girl', 'Gillian Flynn', '9780307588371', 432, '2012-06-05', 'On their fifth wedding anniversary, Nick Dunne''s wife Amy disappears. Under pressure from the police and growing media frenzy, Nick''s portrait of a blissful union begins to crumble.', 'https://covers.openlibrary.org/b/isbn/9780307588371-L.jpg', null, null),
  ('a0000001-0000-0000-0000-000000000004', 'The Shining', 'Stephen King', '9780307743657', 447, '1977-01-28', 'Jack Torrance sees his new position as caretaker of the Overlook Hotel as a way to rebuild his life. But the hotel has other plans for the Torrance family.', 'https://covers.openlibrary.org/b/isbn/9780307743657-L.jpg', null, null),
  ('a0000001-0000-0000-0000-000000000005', 'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', '9780747532699', 223, '1997-06-26', 'Harry Potter discovers on his eleventh birthday that he is the orphaned son of two wizards and possesses unique magical powers of his own.', 'https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg', 'Harry Potter', 1),
  ('a0000001-0000-0000-0000-000000000006', 'The Handmaid''s Tale', 'Margaret Atwood', '9780385490818', 311, '1985-01-01', 'In the Republic of Gilead, a totalitarian theocracy has overthrown the US government. Offred is a Handmaid, forced to bear children for the ruling class.', 'https://covers.openlibrary.org/b/isbn/9780385490818-L.jpg', null, null),
  ('a0000001-0000-0000-0000-000000000007', 'No Country for Old Men', 'Cormac McCarthy', '9780375706677', 309, '2005-07-19', 'When Llewelyn Moss finds a satchel of cash in the desert, he sets off a chain of violence that draws in a relentless killer and an aging sheriff.', 'https://covers.openlibrary.org/b/isbn/9780375706677-L.jpg', null, null),
  ('a0000001-0000-0000-0000-000000000008', 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 180, '1925-04-10', 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, set against the backdrop of the roaring 1920s.', 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg', null, null),
  ('a0000001-0000-0000-0000-000000000009', 'Normal People', 'Sally Rooney', '9780571334650', 266, '2018-08-28', 'Connell and Marianne grow up in the same small town in the west of Ireland but the similarities end there. At school, Connell is popular; Marianne is a loner.', 'https://covers.openlibrary.org/b/isbn/9780571334650-L.jpg', null, null),
  ('a0000001-0000-0000-0000-000000000010', 'Big Little Lies', 'Liane Moriarty', '9780399167065', 460, '2014-07-29', 'A murder mystery set against the backdrop of a school trivia night in a small beachside town. Three women with secrets that could destroy their lives.', 'https://covers.openlibrary.org/b/isbn/9780399167065-L.jpg', null, null);

-- ============================================================
-- SCREEN MEDIA
-- ============================================================
insert into screen_media (id, title, type, director, synopsis, release_date, poster_url, tmdb_id, runtime_minutes, seasons_count) values
  ('c0000001-0000-0000-0000-000000000001', 'Dune', 'film', 'Denis Villeneuve', 'Paul Atreides unites with the Fremen people of the desert planet Arrakis as he wages war against House Harkonnen for control of the spice melange.', '2021-10-22', 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', 438631, 155, null),
  ('c0000001-0000-0000-0000-000000000002', 'Dune: Part Two', 'film', 'Denis Villeneuve', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against those who destroyed his family.', '2024-03-01', 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nez7C.jpg', 693134, 166, null),
  ('c0000001-0000-0000-0000-000000000003', 'The Lord of the Rings: The Fellowship of the Ring', 'film', 'Peter Jackson', 'A young hobbit, Frodo, must destroy a powerful ring to stop the Dark Lord Sauron from enslaving Middle-earth.', '2001-12-19', 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 120, 178, null),
  ('c0000001-0000-0000-0000-000000000004', 'Gone Girl', 'film', 'David Fincher', 'Nick Dunne discovers that the entire media focus has turned on him when his wife, Amy, mysteriously disappears on their fifth wedding anniversary.', '2014-10-03', 'https://image.tmdb.org/t/p/w500/qymaJhZ4JsTMnuw0Bz4SLmMgOOy.jpg', 210577, 149, null),
  ('c0000001-0000-0000-0000-000000000005', 'The Shining', 'film', 'Stanley Kubrick', 'A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.', '1980-05-23', 'https://image.tmdb.org/t/p/w500/nRj5511mZdTl4saWEPoj9QroTIu.jpg', 694, 146, null),
  ('c0000001-0000-0000-0000-000000000006', 'Harry Potter and the Philosopher''s Stone', 'film', 'Chris Columbus', 'An orphaned boy enrolls in a school of wizardry, where he learns the truth about himself, his family and the terrible evil that haunts the magical world.', '2001-11-16', 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDIqP2o.jpg', 671, 152, null),
  ('c0000001-0000-0000-0000-000000000007', 'The Handmaid''s Tale', 'series', null, 'Set in a dystopian future, a woman is forced into servitude as a handmaid in a totalitarian society.', '2017-04-26', 'https://image.tmdb.org/t/p/w500/oIkxqt6ug5C7q7YkMsMBR4l6v0A.jpg', 69478, null, 6),
  ('c0000001-0000-0000-0000-000000000008', 'No Country for Old Men', 'film', 'Joel Coen, Ethan Coen', 'Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash near the Rio Grande.', '2007-11-21', 'https://image.tmdb.org/t/p/w500/bj1v6YKF8yHqA489GFfPC8oHkGZ.jpg', 6977, 122, null),
  ('c0000001-0000-0000-0000-000000000009', 'The Great Gatsby', 'film', 'Baz Luhrmann', 'Nick Carraway, a Midwesterner now living on Long Island, finds himself fascinated by the mysterious past and lavish lifestyle of his neighbor Jay Gatsby.', '2013-05-10', 'https://image.tmdb.org/t/p/w500/tyMAfpEDqy0RHBJ69j2lJWh4DHa.jpg', 64682, 143, null),
  ('c0000001-0000-0000-0000-000000000010', 'Normal People', 'series', null, 'Connell and Marianne navigate a complicated relationship from secondary school to their years at Trinity College Dublin.', '2020-04-26', 'https://image.tmdb.org/t/p/w500/yTVBfEhDAqKCVaJHQJrGUG3NsAT.jpg', 96648, null, 1),
  ('c0000001-0000-0000-0000-000000000011', 'Big Little Lies', 'series', null, 'Three mothers of first-graders become embroiled in a murder investigation in the wealthy coastal town of Monterey.', '2017-02-19', 'https://image.tmdb.org/t/p/w500/fGce04sCKGnoJe0E5HMAhG8i36t.jpg', 66292, null, 2);

-- ============================================================
-- ADAPTATIONS (the links)
-- ============================================================
insert into adaptations (book_id, screen_media_id, adaptation_type, release_year, notes) values
  ('a0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'film', 2021, 'Covers roughly the first half of the novel'),
  ('a0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002', 'film', 2024, 'Covers the second half of the novel'),
  ('a0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000003', 'film', 2001, 'First film in Peter Jackson''s trilogy'),
  ('a0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000004', 'film', 2014, 'Screenplay by Gillian Flynn herself'),
  ('a0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000005', 'film', 1980, 'Stanley Kubrick''s iconic adaptation'),
  ('a0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000006', 'film', 2001, 'First film in the Harry Potter franchise'),
  ('a0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000007', 'series', 2017, 'Hulu original series expanding beyond the novel'),
  ('a0000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000008', 'film', 2007, 'Won four Academy Awards including Best Picture'),
  ('a0000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000009', 'film', 2013, 'Baz Luhrmann''s lavish adaptation starring Leonardo DiCaprio'),
  ('a0000001-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000010', 'miniseries', 2020, 'BBC/Hulu 12-episode adaptation'),
  ('a0000001-0000-0000-0000-000000000010', 'c0000001-0000-0000-0000-000000000011', 'series', 2017, 'HBO series with Reese Witherspoon and Nicole Kidman');
