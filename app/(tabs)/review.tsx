import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, FlatList, Pressable, Text, View } from "react-native";
import { useWords } from "../../src/state/useWords";

function last3DaysStartIso() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 3);
  return start.toISOString();
}

// Component to render text with highlighted words
function HighlightedText({ 
  text, 
  wordsToHighlight, 
  words, 
  router 
}: { 
  text: string; 
  wordsToHighlight: string[];
  words: any[];
  router: any;
}) {
  const renderHighlightedText = () => {
    let parts = [text];
    
    // Split text by each word to highlight
    wordsToHighlight.forEach(word => {
      const newParts: string[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          const splits = part.split(regex);
          const matches = part.match(regex) || [];
          
          for (let i = 0; i < splits.length; i++) {
            if (splits[i]) newParts.push(splits[i]);
            if (matches[i]) newParts.push(matches[i]);
          }
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts.map((part, index) => {
      const isHighlighted = wordsToHighlight.some(word => 
        part.toLowerCase() === word.toLowerCase()
      );
      
      if (isHighlighted) {
        // Find the word object to get its ID
        const wordObj = words.find(w => 
          w.text.toLowerCase() === part.toLowerCase()
        );

        return (
          <Pressable
            key={index}
            onPress={() => {
              if (wordObj) {
                router.push(`/word/${wordObj.id}`);
              }
            }}
            style={{
              backgroundColor: '#FFE4B5',
              paddingHorizontal: 2,
              borderRadius: 3,
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                color: '#8B4513',
              }}
            >
              {part}
            </Text>
          </Pressable>
        );
      }
      
      return (
        <Text key={index}>
          {part}
        </Text>
      );
    });
  };

  return (
    <Text style={{ lineHeight: 22, fontSize: 16 }}>
      {renderHighlightedText()}
    </Text>
  );
}

export default function ReviewScreen() {
  const { words, initAndLoad } = useWords();
  const [busy, setBusy] = useState(false);
  const [generatedParagraph, setGeneratedParagraph] = useState<string>("");
  const router = useRouter();

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

  const generateParagraph = async () => {
    if (topThreeWords.length === 0) {
      return Alert.alert("Nothing to generate", "Add words first on the Words tab.");
    }

    setBusy(true);
    setGeneratedParagraph("");

    try {
      const wordsText = topThreeWords.map(w => w.text);
      const prompt = `You are a writing companion. The user has recently saved these 3 words: ${wordsText[0]}, ${wordsText[1]}, ${wordsText[2]}.  

Write a short, engaging paragraph (4–6 sentences) that naturally uses all three words.  
- It should read smoothly, not like vocabulary drills.  
- You may either tie it to something contemporary (like daily life, culture, or news).
- Make sure the words fit the context and feel memorable.  
- Keep the tone light.`;

      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }

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

      const generatedText = data.candidates[0].content.parts[0].text.trim();
      setGeneratedParagraph(generatedText);
      setBusy(false);

    } catch (error) {
      setBusy(false);
      console.error('Error generating paragraph:', error);
      Alert.alert("Error", `Failed to generate paragraph: ${error.message}`);
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
        title={busy ? "Generating…" : "Generate Story"}
        onPress={generateParagraph}
        disabled={busy || topThreeWords.length === 0}
      />

      {generatedParagraph && (
        <View style={{ 
          marginTop: 16, 
          padding: 16, 
          backgroundColor: '#F8F9FA', 
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: '#4A90E2'
        }}>
          <Text style={{ fontWeight: "600", marginBottom: 8, color: '#4A90E2' }}>
            Your Story:
          </Text>
          <HighlightedText 
            text={generatedParagraph}
            wordsToHighlight={topThreeWords.map(w => w.text)}
            words={words}
            router={router}
          />
        </View>
      )}
    </View>
  );
}