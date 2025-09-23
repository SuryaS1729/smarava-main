import { useEffect, useMemo, useState } from "react";
import { Alert, Button, FlatList, Text, View } from "react-native";
import { useWords } from "../../src/state/useWords";

function last3DaysStartIso() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 3);
  return start.toISOString();
}

export default function ReviewScreen() {
  const { words, initAndLoad } = useWords();
  const [busy, setBusy] = useState(false);
  const [generatedSentences, setGeneratedSentences] = useState<string[]>([]);

  useEffect(() => { initAndLoad(); }, []);

  const startIso = last3DaysStartIso();
  const recent = useMemo(
    () => words.filter(w => Date.parse(w.created_at) >= Date.parse(startIso)),
    [words, startIso]
  );

  // Get top 3 latest words
  const topThreeWords = useMemo(
    () => recent
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 3),
    [recent]
  );

  const generateSentences = async () => {
    if (topThreeWords.length === 0) {
      return Alert.alert("Nothing to generate", "Add words first on the Words tab.");
    }

    setBusy(true);
    setGeneratedSentences([]);

    try {
      const wordsText = topThreeWords.map(w => w.text).join(", ");
      const prompt = `You are a helpful writing assistant. I will give you 3 words, and you need to create exactly 3 sentences that demonstrate the proper usage of these words in context.

Requirements:
- Write exactly 3 sentences
- Each sentence should use one of the provided words naturally and meaningfully
- The sentences should be educational and show clear usage of the word
- Keep sentences concise but informative
- Return only the sentences, one per line, without numbering or bullet points

Words: ${wordsText}`;

      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Use the correct API endpoint from the documentation
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {}
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('No content generated');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Parse the response into sentences
      const sentences = generatedText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.match(/^\d+\./)) // Remove numbered lines
        .slice(0, 3); // Ensure we only take 3 sentences

      setGeneratedSentences(sentences);
      setBusy(false);

    } catch (error) {
      setBusy(false);
      console.error('Error generating sentences:', error);
      Alert.alert("Error", `Failed to generate sentences: ${error.message}`);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Review</Text>

      <Text style={{ fontWeight: "600" }}>Words in last 3 days ({recent.length}):</Text>
      <FlatList
        data={recent}
        keyExtractor={(w) => String(w.id)}
        style={{ maxHeight: 220 }}
        renderItem={({ item }) => <Text>• {item.text}</Text>}
      />

      {topThreeWords.length > 0 && (
        <Text style={{ fontWeight: "600" }}>
          Top 3 latest words: {topThreeWords.map(w => w.text).join(", ")}
        </Text>
      )}

      <Button
        title={busy ? "Generating…" : "Generate Example Sentences"}
        onPress={generateSentences}
        disabled={busy || topThreeWords.length === 0}
      />

      {generatedSentences.length > 0 && (
        <>
          <Text style={{ fontWeight: "600", marginTop: 8 }}>Generated Sentences:</Text>
          <FlatList
            data={generatedSentences}
            keyExtractor={(_, index) => String(index)}
            renderItem={({ item }) => (
              <Text style={{ marginVertical: 4, lineHeight: 20, fontSize: 16 }}>
                • {item}
              </Text>
            )}
          />
        </>
      )}
    </View>
  );
}