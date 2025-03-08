/*
  # Initial Schema Setup for Scrum Planner

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
    - `stories`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key)
    - `sprints`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `goal` (text)
      - `capacity` (integer)
      - `status` (text)
      - `user_id` (uuid, foreign key)
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `priority` (text)
      - `story_points` (integer)
      - `status` (text)
      - `assignee` (text)
      - `story_id` (uuid, foreign key)
      - `sprint_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create tables
-- Create tables
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('New', 'Ready', 'In Sprint')),
  createdAt timestamptz DEFAULT now(),
  userId uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  startDate date NOT NULL,
  endDate date NOT NULL,
  goal text,
  capacity integer NOT NULL DEFAULT 40,
  status text NOT NULL CHECK (status IN ('Planned', 'In Progress', 'Completed')),
  userId uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  priority text NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  storyPoints integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('New', 'Ready', 'In Sprint', 'To Do', 'In Progress', 'Review', 'Done')),
  assignee text,
  storyId uuid REFERENCES stories(id) ON DELETE SET NULL,
  sprintId uuid REFERENCES sprints(id) ON DELETE SET NULL,
  userId uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  createdAt timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Update Policies to match camelCase column names
DROP POLICY IF EXISTS "Users can manage their own stories" ON stories;
DROP POLICY IF EXISTS "Users can manage their own sprints" ON sprints;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;

CREATE POLICY "Users can manage their own stories"
  ON stories
  FOR ALL
  TO authenticated
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can manage their own sprints"
  ON sprints
  FOR ALL
  TO authenticated
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);