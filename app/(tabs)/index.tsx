import { listenWordSaved } from "@smara/context-menu";
import { useRouter } from 'expo-router';
import { useEffect, useState } from "react";
import { Button, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useWords } from "../../src/state/useWords";

export default function WordsScreen() {
  const { words, loading, initAndLoad, add, remove, reload } = useWords();
  const [text, setText] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    initAndLoad();
    console.log("Initial words:", words);

    const unsub = listenWordSaved((event) => {
      console.log("Word saved from context menu:", event);
      
      // Force a complete refresh with delay to ensure native write is complete
      setTimeout(() => {
        console.log("About to reload after context menu save...");
        reload();
        setRefreshKey(prev => prev + 1);
      }, 500); // Increased delay
    });
    return () => unsub();
  }, []);

  // Log whenever words change
  useEffect(() => {
    console.log("Words state updated:", words.length, "words");
  }, [words]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smara — Words</Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a word or phrase"
          style={styles.textInput}
          autoCapitalize="none" 
          autoCorrect={false}
          onSubmitEditing={() => { 
            add(text); 
            setText(""); 
          }}
        />
        <Button title="Add" onPress={() => { 
          add(text); 
          setText(""); 
        }} />
      </View>

      {/* Add manual refresh button for testing */}
      <View style={styles.debugContainer}>
        <Button title="Manual Refresh" onPress={() => {
          console.log("Manual refresh triggered");
          reload();
          setRefreshKey(prev => prev + 1);
        }} />
        <Button title="Wall of Words" onPress={() => {
          console.log("Navigating to Wall of Words");
          router.push("/wall");
        }} />
      </View>

      <Text style={styles.subtitle}>
        {words.length} word{words.length !== 1 ? 's' : ''} saved
      </Text>

      <FlatList
        key={refreshKey}
        data={words}
        keyExtractor={(w) => String(w.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No words saved yet</Text>
            <Text style={styles.emptySubtext}>
              Add words manually or select text in other apps and choose "Save to Smara"
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => router.push(`/word/${item.id}`)}
            style={styles.wordItem}
          >
            <View style={styles.wordContent}>
              <Text style={styles.wordText}>{item.text}</Text>
              {item.source_app && (
                <Text style={styles.sourceText}>
                  from {item.source_app}
                </Text>
              )}
            </View>
            <Pressable 
              onPress={(e) => {
                e.stopPropagation(); // Prevent navigation when deleting
                remove(item.id);
              }} 
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  debugContainer: {
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
  },
  wordItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordContent: {
    flex: 1,
  },
  wordText: {
    fontSize: 16,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    color: "#666",
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: "#b91c1c",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
