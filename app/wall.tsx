import { useRouter } from 'expo-router';
import { useEffect, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useWords } from "../src/state/useWords";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BRICK_HEIGHT = 50;
const BRICK_PADDING = 0;
const MIN_BRICK_WIDTH = 60;
const CANVAS_WIDTH = screenWidth * 0.8; // Grey canvas is 80% of screen width
const CANVAS_MARGIN = (screenWidth - CANVAS_WIDTH) / 2;

export default function WallScreen() {
  const { words, loading, initAndLoad } = useWords();
  const [brickRows, setBrickRows] = useState<Array<Array<any>>>([]);
  const router = useRouter();

  useEffect(() => {
    initAndLoad();
  }, []);

  useEffect(() => {
    if (words.length > 0) {
      layoutBricks();
    }
  }, [words]);

  const calculateInitialBrickWidth = (text: string) => {
    // Base width calculation for initial row planning
    const baseWidth = Math.max(text.length * 10 + 20, MIN_BRICK_WIDTH);
    const maxWidth = CANVAS_WIDTH - (BRICK_PADDING * 4);
    return Math.min(baseWidth, maxWidth);
  };

  const layoutBricks = () => {
    const rows: Array<Array<any>> = [];
    let currentRow: Array<any> = [];
    let currentRowWidth = 0;
    const availableWidth = CANVAS_WIDTH - (BRICK_PADDING * 4); // Account for canvas padding

    // First pass: group words into rows based on approximate widths
    words.forEach((word) => {
      const brickWidth = calculateInitialBrickWidth(word.text);
      const widthWithPadding = brickWidth + (currentRow.length > 0 ? BRICK_PADDING : 0);
      
      // Check if brick fits in current row
      if (currentRowWidth + widthWithPadding <= availableWidth && currentRow.length > 0) {
        currentRow.push({ ...word, initialWidth: brickWidth });
        currentRowWidth += widthWithPadding;
      } else {
        // Start new row
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [{ ...word, initialWidth: brickWidth }];
        currentRowWidth = brickWidth;
      }
    });

    // Add the last row if it has items
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    // Second pass: redistribute widths to fill each row completely
    const finalRows = rows.map(row => {
      const totalPaddingSpace = (row.length - 1) * BRICK_PADDING;
      const availableWidthForBricks = availableWidth - totalPaddingSpace;
      
      // Calculate the total proportional weight based on initial widths
      const totalWeight = row.reduce((sum, brick) => sum + brick.initialWidth, 0);
      
      // Redistribute width proportionally to fill the entire row
      return row.map(brick => ({
        ...brick,
        width: Math.floor((brick.initialWidth / totalWeight) * availableWidthForBricks)
      }));
    });

    setBrickRows(finalRows);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WALL OF WORDS</Text>
      </View>

      <View style={styles.canvasContainer}>
        <View style={styles.canvas}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[
              styles.wallContainer,
              { 
                minHeight: screenHeight - 200,
                justifyContent: 'flex-end' // Start from bottom
              }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {brickRows.length > 0 && brickRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((word, wordIndex) => (
                  <Pressable
                    key={word.id}
                    onPress={() => router.push(`/word/${word.id}`)}
                    style={[
                      styles.brick,
                      {
                        width: word.width,
                      }
                    ]}
                  >
                    <Text 
                      style={styles.brickText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {word.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
            
            {words.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Your wall is empty</Text>
                <Text style={styles.emptySubtext}>
                  Add some words to start building
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 2,
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: CANVAS_MARGIN,
  },
  canvas: {
    width: CANVAS_WIDTH,
    flex: 1,
    backgroundColor: '#CCCCCC',
  },
  scrollView: {
    flex: 1,
  },
  wallContainer: {
    padding: BRICK_PADDING * 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: BRICK_PADDING,
    gap: BRICK_PADDING,
  },
  brick: {
    height: BRICK_HEIGHT,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  brickText: {
    fontSize: 12,
    fontFamily:"Poppins",
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',

  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
});