import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { StoryCard } from './StoryCard';
import type { StoriesSectionProps, StoryCardData } from './types';

export const StoriesSection: React.FC<StoriesSectionProps> = ({
  stories,
  onStoryPress,
}) => {
  const visibleStories = stories.filter((story) => story.visible !== false);

  if (visibleStories.length === 0) {
    return null;
  }

  const handlePress = (story: StoryCardData) => {
    if (story.onPress) {
      story.onPress();
    } else if (onStoryPress) {
      onStoryPress(story);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={152} // CARD_WIDTH + marginRight
      >
        {visibleStories.map((story) => (
          <StoryCard
            key={story.id}
            {...story}
            onPress={() => handlePress(story)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
});

