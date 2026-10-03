export type StreamCollectionEpisodeItem = {
  videoId: string;
  title: string;
  url: string;
};

export type StreamCollectionSectionItem = {
  id: string;
  title: string;
  episodes: StreamCollectionEpisodeItem[];
};

export type StreamCollectionItem = {
  id: string;
  title: string;
  sections: StreamCollectionSectionItem[];
};
