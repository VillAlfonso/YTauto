export type VideoRef = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  published_at: string;
  duration_seconds: number;
  views: number;
  likes: number;
  comments: number;
  view_velocity: number;
  engagement_rate: number;
  proxy_score: number;
  url: string;
};

export type TrendTopic = {
  query: string;
  label: string;
  rising_trend_score: number | null;
  top_videos: VideoRef[];
  topic_proxy_score: number;
};

export type TrendsResponse = {
  category: string;
  generated_at: string;
  topics: TrendTopic[];
};

export type Category = { key: string; label: string };

// ---- Content pipeline ----

export type Genre = { key: string; label: string };

export type Finding = {
  working_title: string;
  hook: string;
  key_facts: string[];
  characters: string[];
  tensions: string[];
  sources_hint: string;
  confidence: string;
};

export type DeepDiveResponse = {
  genre: string;
  findings: Finding[];
};

export type Story = {
  id: string;
  title: string;
  logline: string;
  beats: string[];
  tone_hint: string;
  needs_visuals: string[];
};

export type OrganizeResponse = {
  stories: Story[];
};

export type Script = {
  story_id: string;
  title: string;
  script: string;
  target_seconds: number;
  word_count: number;
};

export type Cluster = {
  id: string;
  start: number;
  end: number;
  color: string;
  label: string;
  suggested_image: string;
  scene_description: string;
};

export type ClusterResponse = {
  script: string;
  clusters: Cluster[];
};

export type TitleCandidate = {
  text: string;
  hook_style: string;
  reasoning: string;
};

export type TitlesResponse = {
  idea: string;
  titles: TitleCandidate[];
};

export type Route = {
  id: string;
  label: string;
  angle: string;
  treatment: string;
  why_this_works: string;
};

export type RoutesResponse = {
  title: string;
  routes: Route[];
};

export type DeepDiveSeed = {
  title: string;
  angle?: string;
  treatment?: string;
};

// ---- Prototype flow: paste-script -> section -> brief -> generate ----

export type Section = {
  id: string;
  start: number;
  end: number;
  color: string;
  summary: string;
};

export type SectionsResponse = {
  script: string;
  sections: Section[];
};

export type ImageBrief = {
  section_id: string;
  image_brief: string;
  subject: string;
  mood: string;
};

export type ImageBriefsResponse = {
  briefs: ImageBrief[];
};

export type GeneratedImage = {
  section_id: string;
  image_url: string;
  image_prompt: string;
  references_previous: boolean;
};

export type GeneratedImagesResponse = {
  images: GeneratedImage[];
};

// Real-editor timeline clip. Decoupled from section_id so split halves and
// manually-added clips work the same as auto-generated ones.
export type TimelineClip = {
  id: string;
  image_url: string | null;
  start_seconds: number;
  duration_seconds: number;
  section_id?: string;
};
