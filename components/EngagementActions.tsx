import { Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from "nativewind";
import Comment from "~/assets/svg/comment.svg";
import Repost from "~/assets/svg/repost.svg";
import Save from "~/assets/svg/save.svg";
import Views from "~/assets/svg/views.svg";
import LikeButton from './LikeButton';
import { Feather } from '@expo/vector-icons';
// Reusable Engagement Actions Component
export const EngagementActions = ({ detailView }: { detailView?: boolean }) => {
    const { colorScheme } = useColorScheme();
    const iconColor = colorScheme === 'dark' ? '#8b98a5' : '#536471';
    const textColor = "text-sm text-neutral-600 dark:text-neutral-400";

    return (
        <View className="flex-row items-center justify-between mt-2">
            <TouchableOpacity className="flex-row items-center gap-1.5">
                <Comment width={18} height={18} fill={iconColor} />
                <Text className={textColor}>100</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center gap-1.5">
                <Repost width={18} height={18} fill={iconColor} />
                <Text className={textColor}>100</Text>
            </TouchableOpacity>

            <LikeButton iconColor={iconColor} textColor={textColor} />

            {!detailView && (
                <TouchableOpacity className="flex-row items-center gap-1.5">
                    <Views width={18} height={18} fill={iconColor} />
                    <Text className={textColor}>100</Text>
                </TouchableOpacity>
            )}


            <TouchableOpacity className="flex-row items-center gap-1.5">
                <Save width={18} height={18} fill={iconColor} />
                {detailView && <Text className={textColor}>100</Text>}
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center gap-1.5">
                <Feather name="share" size={18} color={iconColor} />
            </TouchableOpacity>
        </View>
    );
};