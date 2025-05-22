import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    FlatList,
    Text,
    ViewToken,
} from 'react-native';
import { FeedContent } from '~/components/FeedItem'; // Keep FeedContent if processedFeedItems uses it
import VideoFeedItem, { VideoPlayerData } from '~/components/VideoFeedItem'; // Import the new component and VideoPlayerData
import sampleFeedItems from '~/dummy/posts.json';
import users from '~/dummy/users.json'; // Keep if used for author details not in posts.json directly

// Map raw post data to VideoPlayerData structure for consistency
const processedFeedItems: VideoPlayerData[] = sampleFeedItems
    .map((item: any): VideoPlayerData | null => {
        // Logic to handle different post structures and map to VideoPlayerData
        let authorName = 'Unknown Author';
        let authorHandle = 'unknownhandle';
        let authorImageUrl = ''; // Add a default or placeholder image URL

        if (typeof item.poster_id === 'string') {
            const user = users.find(u => u.id === item.poster_id);
            if (user) {
                authorName = user.name;
                authorHandle = user.handle;
                authorImageUrl = user.profile_picture;
            }
        } else if (typeof item.authorName === 'string') {
            authorName = item.authorName;
            authorHandle = item.authorHandle || authorHandle;
            authorImageUrl = item.authorImageUrl || authorImageUrl;
        }

        // Ensure media_url and contentId exist, and media_type is 'video'
        if (item.media_type === 'video' && (item.media_url || item.mediaUrl) && item.contentId) {
            return {
                id: item.contentId, // Use contentId for VideoPlayerData id
                videoSource: item.media_url || item.mediaUrl,
                posterSource: item.thumbnail_url || undefined,
                authorName: authorName,
                authorHandle: authorHandle,
                // authorImageUrl: authorImageUrl, // authorImageUrl is not part of VideoPlayerData, add if needed
                caption: item.message || 'No caption',
            };
        }
        return null; // Filter out non-video items or items missing crucial data
    })
    .filter((item): item is VideoPlayerData => item !== null); // Type guard to ensure all items are VideoPlayerData


// This might need adjustment based on the actual structure of your posts.json after updates.
/*
const processedFeedItems: FeedContent[] = sampleFeedItems.map((item: any): FeedContent => {
    // Existing logic to handle different post structures
    if (typeof item.poster_id === 'string') { // Original structure
        const user = users.find(u => u.id === item.poster_id);
        return {
            contentId: item.contentId || `post-${item.poster_id}-${item.posted_time || Date.now()}`,
            poster_id: item.poster_id,
            authorName: user?.name || 'Unknown Author',
            authorHandle: user?.handle || 'unknownhandle',
            authorImageUrl: user?.profile_picture || '',
            posted_time: typeof item.posted_time === 'string' ? parseInt(item.posted_time, 10) :
                typeof item.posted_time === 'number' ? item.posted_time : Date.now(),
            message: item.message || '',
            media_url: item.media_url || item.mediaUrl || undefined, // Consolidate media_url and mediaUrl
            thumbnail_url: item.thumbnail_url || undefined,
            like_count: item.like_count || 0,
            retweet_count: item.retweet_count || 0,
            reply_count: item.reply_count || 0,
            view_count: item.view_count || '0',
            category: item.category || 'For you',
            media_type: item.media_type || (item.media_url || item.mediaUrl ? 'video' : 'text') // Infer media_type
        };
    } else if (typeof item.authorName === 'string') { // Newer structure from initial posts
        const matchingUser = users.find(user => user.name === item.authorName);
        return {
            contentId: item.contentId || `post-legacy-${item.authorHandle}-${item.postedTime || Date.now()}`,
            poster_id: matchingUser?.id || '0',
            authorName: item.authorName,
            authorHandle: item.authorHandle || (matchingUser?.handle || 'unknownhandle'),
            authorImageUrl: item.authorImageUrl || (matchingUser?.profile_picture || ''),
            posted_time: typeof item.postedTime === 'string' ? parseInt(item.postedTime, 10) :
                typeof item.postedTime === 'number' ? item.postedTime : Date.now(),
            message: item.message || '',
            media_url: item.mediaUrl || item.media_url || undefined,
            thumbnail_url: item.thumbnail_url || undefined,
            like_count: item.likeCount || 0,
            retweet_count: item.retweetCount || 0,
            reply_count: item.replyCount || 0,
            view_count: item.viewCount || '0',
            category: item.category || 'For you',
            media_type: item.media_type || (item.mediaUrl || item.media_url ? 'video' : 'text')
        };
    }
    // Fallback for unknown structure
    return {
        contentId: `post-unknown-${Date.now()}`,
        poster_id: '0',
        authorName: 'Unknown Author',
        authorHandle: 'unknownhandle',
        authorImageUrl: '',
        posted_time: Date.now(),
        message: 'Unknown post format',
        media_url: undefined,
        thumbnail_url: undefined,
        like_count: 0,
        retweet_count: 0,
        reply_count: 0,
        view_count: '0',
        category: 'For you',
        media_type: 'text'
    };
}).filter(item => item.media_type === 'video' && item.media_url); // Filter for video posts with a media_url
*/

const { height: windowHeight } = Dimensions.get('window');

export default function HomeScreen() {
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50, // Trigger when 50% of the item is visible
    };

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
        if (viewableItems.length > 0) {
            // Prioritize the first viewable item as the active one
            const firstViewableItem = viewableItems[0];
            if (firstViewableItem.isViewable && firstViewableItem.item) {
                setActiveVideoId(firstViewableItem.item.id);
            }
        }
    }, []);

    // Use a ref for onViewableItemsChanged to prevent FlatList re-renders if the function identity changes
    // This is often not strictly necessary with useCallback if dependencies are stable, but good practice for performance.
    const onViewableItemsChangedRef = useRef(onViewableItemsChanged);


    const renderVideoItem = ({ item }: { item: VideoPlayerData }) => {
        return (
            <View style={styles.itemContainer}>
                <VideoFeedItem
                    initialVideoData={item}
                    isActive={item.id === activeVideoId}
                />
            </View>
        );
    };

    if (processedFeedItems.length === 0) {
        return (
            <View style={styles.emptyFeedContainer}>
                <Text style={styles.emptyFeedText}>No videos available at the moment.</Text>
                <Text style={styles.emptyFeedSubText}>Please check back later or ensure 'dummy/posts.json' has video entries.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={processedFeedItems}
                renderItem={renderVideoItem}
                keyExtractor={(item) => item.id} // Use the new id field from VideoPlayerData
                pagingEnabled
                showsVerticalScrollIndicator={false}
                getItemLayout={(_data, index) => (
                    { length: windowHeight * 0.9, offset: (windowHeight * 0.9) * index, index }
                )}
                onViewableItemsChanged={onViewableItemsChangedRef.current}
                viewabilityConfig={viewabilityConfig}
                // Adding a small delay before firing onViewableItemsChanged can sometimes help
                // viewabilityConfigCallbackPairs={[{ viewabilityConfig, onViewableItemsChanged }]} // Alternative way
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    itemContainer: {
        height: windowHeight * 0.9,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyFeedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 20,
    },
    emptyFeedText: {
        color: '#FFF',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
    },
    emptyFeedSubText: {
        color: '#AAA',
        fontSize: 14,
        textAlign: 'center',
    },
});