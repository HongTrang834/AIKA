// Japanese N2 Learning Platform - Database Diagram
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
  category varchar
  examples text [note: 'JSON array of examples']
  level int [default: 2]
}

Table flashcard_decks {
  id int [primary key]
  user_id int [not null]
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
  scenario_id int
  user_message varchar
  ai_response varchar
  grammar_errors json
  created_at timestamp
  
  indexes {
    user_id
  }
}

Table scenarios {
  id int [primary key]
  title varchar [not null]
  description varchar
  context varchar
  example_conversation text
  difficulty_level int
  created_at timestamp
}

Table user_progress {
  id int [primary key]
  user_id int [unique, not null]
  total_vocab_learned int [default: 0]
  total_grammar_learned int [default: 0]
  total_kaiwas int [default: 0]
  total_flashcard_reviews int [default: 0]
  last_activity timestamp
  created_at timestamp
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
Ref: conversation_history.scenario_id > scenarios.id
Ref: user_progress.user_id > users.id
