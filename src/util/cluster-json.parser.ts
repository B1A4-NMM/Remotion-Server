// 하나의 문장 (id와 텍스트)
export interface ClusterSentence {
  id: number;
  text: string;
}

// 클러스터 하나의 정보
export interface Cluster {
  cluster_id: number;
  cluster_size: number;
  representative_sentence: ClusterSentence;
  sentences: ClusterSentence[];
}

// 전체 클러스터링 결과
export interface ClusteringResult {
  clusters: Cluster[];
  optimal_clusters: number;
  silhouette_score: number;
  total_sentences: number;
}
