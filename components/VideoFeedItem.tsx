import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import SimilarVideoThumbnail, { SimilarVideoData } from './SimilarVideoThumbnail';

// Define a unified structure for video data used by the main player
export interface VideoPlayerData {
  id: string; // Can be from original post or similar video id
  videoSource: string;
  posterSource?: string;
  authorName: string;
  authorHandle: string;
  caption: string;
}

// Props for the VideoFeedItem component, now takes initial video data
interface VideoFeedItemProps {
  initialVideoData: VideoPlayerData;
  isActive: boolean; // New prop to control playback based on visibility
  // In a real app, similar videos might also be passed as props
  // similarVideos?: SimilarVideoData[];
}

const VideoFeedItem: React.FC<VideoFeedItemProps> = ({
  initialVideoData,
  isActive,
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Initial state: not playing until active and user interaction
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the currently playing video, initialized with the initial data
  const [currentVideo, setCurrentVideo] = useState<VideoPlayerData>(initialVideoData);

  // Effect to update current video if the initialVideoData prop changes
  useEffect(() => {
    setCurrentVideo(initialVideoData);
    setIsLoading(true); // Show loading for new video
    // isActive will handle play/pause, so we don't auto-play here
    // We also reset isPlaying to false as it's a new video item
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.unloadAsync().then(() => {
        videoRef.current?.loadAsync({ uri: initialVideoData.videoSource }, { shouldPlay: false });
      });
    }
  }, [initialVideoData]);


  // Effect to control playback based on isActive prop
  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    if (isActive) {
      // If the video is active, and it was previously playing (user-initiated) or it's set to autoplay on active
      // For now, let's assume we want it to play when active, unless user explicitly paused.
      // The `isPlaying` state here reflects user's latest interaction or desired state.
      // If we want true autoplay on becoming active:
      videoRef.current.playAsync().then(() => setIsPlaying(true)).catch(e => console.error("Error playing video on active: ", e));
    } else {
      videoRef.current.pauseAsync().then(() => setIsPlaying(false)).catch(e => console.error("Error pausing video on inactive: ", e));
    }
  }, [isActive, videoRef.current]); // Rerun when isActive or videoRef changes


  // Dummy data for similar videos, conforming to SimilarVideoData
  const dummySimilarVideos: SimilarVideoData[] = [
    { id: 'sim1', media_url: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4', thumbnail_url: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217', title: 'Big Buck Bunny (Similar)' },
    { id: 'sim2', media_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbnail_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', title: 'Elephants Dream (Similar)' },
    { id: 'sim3', media_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnail_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg', title: 'For Bigger Blazes (Similar)' },
    // Add more diverse dummy videos if needed
  ];

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleSimilarVideoSelect = async (selectedVideo: SimilarVideoData) => {
    console.log(`Switching to: ${selectedVideo.title}`);
    setCurrentVideo(prev => ({
      ...prev, // Keep author details from the original video or allow them to be part of SimilarVideoData
      id: selectedVideo.id,
      videoSource: selectedVideo.media_url,
      posterSource: selectedVideo.thumbnail_url,
      caption: selectedVideo.title, // Update caption to the title of the similar video
      // authorName: selectedVideo.authorName || prev.authorName, // If similar videos have author info
      // authorHandle: selectedVideo.authorHandle || prev.authorHandle,
    }));
    // setIsPlaying(true); // isActive effect will handle playing
    setIsLoading(true);
    if (videoRef.current) {
      // It's often better to unload the previous source and load the new one
      // especially if `source` prop changes don't trigger a reload reliably on all platforms/SDKs.
      await videoRef.current.unloadAsync();
      // Load new video, isActive will determine if it should play
      await videoRef.current.loadAsync({ uri: selectedVideo.media_url }, { shouldPlay: isActive && isPlaying }, false);
    }
  };

  const { height: windowHeight } = Dimensions.get('window');

  return (
    <View style={[styles.container, { height: windowHeight * 0.9 }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePlayPause} style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: currentVideo.videoSource }}
          posterSource={currentVideo.posterSource ? { uri: currentVideo.posterSource } : undefined}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false} // Controlled by isActive and user interaction effects
          isLooping // Keep looping for main video, can be part of VideoPlayerData if needed
          useNativeControls={false}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsLoading(false); // Video is loaded, not necessarily playing
              setError(null);
              // Update isPlaying state based on actual playback if needed and not triggered by our own effects
              // This can help sync state if video pauses for other reasons (buffering, etc.)
              // Be careful not to create loops with the isActive effect.
              // setIsPlaying(status.isPlaying);
            } else if (status.error) {
              setError(`Video Error: ${status.error}`);
              setIsLoading(false);
              console.error('Video Playback Error:', status.error);
            }
          }}
          onLoadStart={() => {
            setIsLoading(true);
            setError(null);
          }}
          onError={(e) => { // This is for critical errors, not just playback status
            setError(`Failed to load video. ${e}`);
            setIsLoading(false);
            console.error('Video Load Error:', e);
          }}
        />
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {error && !isLoading && ( // Only show error if not also loading
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.overlayContent}>
        <View style={styles.textContainer}>
          <Text style={styles.authorName}>{currentVideo.authorName}</Text>
          <Text style={styles.authorHandle}>@{currentVideo.authorHandle}</Text>
          <Text style={styles.caption}>{currentVideo.caption}</Text>
        </View>
      </View>

      {/* Similar Videos Horizontal List */}
      {dummySimilarVideos.length > 0 && (
        <View style={styles.similarVideosContainer}>
          <Text style={styles.similarVideosTitle}>Similar Content</Text>
          <FlatList
            data={dummySimilarVideos}
            renderItem={({ item }) => (
              <SimilarVideoThumbnail
                videoData={item} // Pass the whole item
                onVideoSelect={handleSimilarVideoSelect}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarVideosListContent}
          />
        </View>
      )}
    </View>
  );
}; // Corrected: Removed the extra '};' by ensuring this is the component's closing brace

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Background for the container, visible during loading or if video doesn't cover
    justifyContent: 'center',
    alignItems: 'center', // Center video within its container
    width: '100%', // Assume full width from parent
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute', // Ensure TouchableOpacity covers the video
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  errorText: {
    color: '#FFF',
    textAlign: 'center',
  },
  overlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background for text
  },
  textContainer: {
    // Add specific styling if needed, e.g., text shadow for readability
  },
  authorName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorHandle: {
    color: '#DDD',
    fontSize: 14,
    marginBottom: 5,
  },
  caption: {
    color: '#FFF',
    fontSize: 14,
  },
  similarVideosContainer: {
    position: 'absolute',
    bottom: 80, // Adjust this value to position above the main overlay or as desired
    left: 0,
    right: 0,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  similarVideosTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 5,
  },
  similarVideosListContent: {
    paddingLeft: 7, // Start thumbnails slightly offset from the left edge
    paddingRight: 15,
  },
});

export default VideoFeedItem;
