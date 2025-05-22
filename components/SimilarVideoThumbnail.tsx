import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

// Define a more specific type for the video data
export interface SimilarVideoData {
  id: string;
  media_url: string;
  thumbnail_url?: string;
  title: string;
}

interface SimilarVideoThumbnailProps {
  videoData: SimilarVideoData;
  onVideoSelect: (videoData: SimilarVideoData) => void;
}

const SimilarVideoThumbnail: React.FC<SimilarVideoThumbnailProps> = ({
  videoData,
  onVideoSelect,
}) => {
  return (
    <TouchableOpacity onPress={() => onVideoSelect(videoData)} style={styles.container}>
      {videoData.thumbnail_url ? (
        <Image source={{ uri: videoData.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={2}>
        {videoData.title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120, // Adjust width as needed
    marginHorizontal: 8,
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: 80, // Adjust height as needed
    borderRadius: 8,
    backgroundColor: '#333', // Placeholder background
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFF',
    fontSize: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SimilarVideoThumbnail;
