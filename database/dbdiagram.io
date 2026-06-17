// Japanese N2 Learning Platform - Database Diagram (Updated)
// Paste this content at https://dbdiagram.io/d

Table users {
  id int [primary key]
  username varchar [unique, not null]
  email varchar [unique, not null]
  password_hash varchar [not null]
  full_name varchar
  avatar_url text
  role varchar [default: 'student']
  created_at timestamp
  updated_at timestamp
}

Table vocabulary {
  id int [primary key]
  word varchar [not null]
  reading varchar [not null]
  meaning varchar [not null]
  category varchar
  level int [default: 2]
  example_sentence varchar
  example_translation varchar
  examples text [note: 'JSON array of examples']
  created_at timestamp
}

Table grammar {
  id int [primary key]
  title varchar [not null]
  pattern varchar [not null]
  explanation varchar [not null]
  meaning varchar [not null]
  example_sentence varchar
  example_translation varchar
  category varchar
  examples text [note: 'JSON array of examples']
  level int [default: 2]
}

Table flashcard_decks {
  id int [primary key]
  user_id int [note: 'Nullable for global decks']
  name varchar [not null]
  description varchar
  color varchar [default: 'blue']
  is_global boolean [default: false]
  created_at timestamp
  updated_at timestamp
  
  indexes {
    user_id
    is_global
    (user_id, name) [unique]
  }
}

Table flashcards {
  id int [primary key]
  user_id int
  vocab_id int
  grammar_id int
  deck_id int
  interval int [default: 1]
  repetitions int [default: 0]
  ease_factor decimal [default: 2.5]
  next_review_date timestamp
  created_at timestamp
  
  indexes {
    user_id
    vocab_id
    grammar_id
    deck_id
  }
}

Table tests {
  id int [primary key]
  name varchar [not null]
  category varchar [not null]
  topic_type varchar [default: 'vocabulary']
  description text
  total_questions int [default: 5]
  created_at timestamp
  updated_at timestamp
}

Table test_questions {
  id int [primary key]
  test_id int [not null]
  question_text text [not null]
  question_type varchar [not null]
  correct_answer varchar [not null]
  options jsonb [not null]
  explanation text
  vocab_id int
  grammar_id int
  created_at timestamp
  
  indexes {
    test_id
  }
}

Table test_results {
  id int [primary key]
  user_id int [not null]
  test_id int [not null]
  score decimal
  total_questions int
  answered_questions int
  completed_at timestamp
  answers jsonb
  
  indexes {
    user_id
    test_id
  }
}

Table conversation_history {
  id int [primary key]
  user_id int [not null]
  mode varchar
  user_message varchar
  ai_response varchar
  grammar_errors json
  created_at timestamp
  
  indexes {
    user_id
  }
}

Table user_progress {
  id int [primary key]
  user_id int [unique, not null]
  total_vocab_learned int [default: 0]
  total_grammar_learned int [default: 0]
  total_kaiwas int [default: 0]
  total_flashcard_reviews int [default: 0]
  last_lesson_id int
  last_activity timestamp
  created_at timestamp
}

Table units {
  id int [primary key]
  title varchar [not null]
  description varchar
  sequence_number int [not null]
  difficulty_level int [default: 2]
  created_at timestamp
}

Table lessons {
  id int [primary key]
  unit_id int [not null]
  title varchar [not null]
  description varchar
  lesson_number decimal [not null]
  type varchar
  content text
  vocabulary_count int [default: 0]
  grammar_count int [default: 0]
  sequence_number int [not null]
  created_at timestamp
}

Table user_vocabulary_learned {
  id int [primary key]
  user_id int [not null]
  vocabulary_id int [not null]
  status varchar [default: 'NEW']
  learned_at timestamp
  review_count int [default: 0]
  last_reviewed_at timestamp
  created_at timestamp
  updated_at timestamp
  
  indexes {
    user_id
    status
    (user_id, vocabulary_id) [unique]
  }
}

Table user_grammar_learned {
  id int [primary key]
  user_id int [not null]
  grammar_id int [not null]
  status varchar [default: 'NEW']
  learned_at timestamp
  review_count int [default: 0]
  last_reviewed_at timestamp
  created_at timestamp
  updated_at timestamp
  
  indexes {
    user_id
    status
    (user_id, grammar_id) [unique]
  }
}

// Foreign Keys
Ref: flashcard_decks.user_id > users.id
Ref: flashcards.user_id > users.id
Ref: flashcards.vocab_id > vocabulary.id
Ref: flashcards.grammar_id > grammar.id
Ref: flashcards.deck_id > flashcard_decks.id
Ref: tests.id < test_questions.test_id
Ref: test_questions.vocab_id > vocabulary.id
Ref: test_questions.grammar_id > grammar.id
Ref: test_results.user_id > users.id
Ref: test_results.test_id > tests.id
Ref: conversation_history.user_id > users.id
Ref: user_progress.user_id > users.id
Ref: user_progress.last_lesson_id > lessons.id
Ref: lessons.unit_id > units.id
Ref: user_vocabulary_learned.user_id > users.id
Ref: user_vocabulary_learned.vocabulary_id > vocabulary.id
Ref: user_grammar_learned.user_id > users.id
Ref: user_grammar_learned.grammar_id > grammar.id
