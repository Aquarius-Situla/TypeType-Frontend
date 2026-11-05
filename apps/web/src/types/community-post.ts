export type CommunityPostType = "text" | "image" | "poll" | "video" | "shared_post" | "unknown";

export type CommunityPostPoll = {
  type: "text" | "image" | "quiz" | "unknown";
  choices: { text: string; imageUrl?: string | null }[];
  voteCount?: number | null;
  textualVoteCount: string;
};

export type CommunityPostVideo = {
  url: string;
  title: string;
  thumbnailUrl: string;
};

export type CommunityPost = {
  id: string;
  url: string;
  type: CommunityPostType;
  text: string;
  authorName: string;
  authorUrl: string;
  authorAvatarUrl: string;
  publishedTime: string;
  publishedAt?: number | null;
  likeCount?: number | null;
  textualLikeCount: string;
  commentCount?: number | null;
  textualCommentCount: string;
  images: string[];
  poll?: CommunityPostPoll | null;
  video?: CommunityPostVideo | null;
  sharedPost?: CommunityPost | null;
};

export type ChannelPostsResponse = {
  channelName: string;
  channelUrl: string;
  posts: CommunityPost[];
  nextpage: string | null;
};
