import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Lock, Camera, MapPin, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'leo';
  timestamp: Date;
  imageUrl?: string;
}

export function LeoAIChatbot() {
  const { isGuest } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: isGuest 
        ? 'Hello! I\'m Lakbay, your AI travel assistant. To use the AI chat feature, please sign in for full access to personalized travel recommendations!'
        : 'Hello! I\'m Lakbay, your AI travel assistant. I can help you discover tourist spots, accommodations, and provide travel tips for Cabuyao, Laguna. What would you like to know?',
      sender: 'leo',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    // Block guests from using AI chat
    if (isGuest) {
      const blockedMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'AI chat is only available for registered users. Please sign in to access personalized travel recommendations and chat with Leo.',
        sender: 'leo',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, blockedMessage]);
      return;
    }

    // Create user message with optional image
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      imageUrl: imagePreview || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputValue;
    setInputValue('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      // Prepare the message content
      let messageContent = currentMessage;
      if (selectedImage) {
        messageContent += " [User attached an image]";
      }

      // Example: Hardcoded API key (⚠️ not safe for production!)
      const response = await fetch("https://api.chatanywhere.tech/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
    "HTTP-Referer": window.location.origin,
    "X-Title": "Lakbay Travel Assistant",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are Lakbay, an AI travel assistant specialized in providing information about tourist spots, accommodations, and travel tips for Cabuyao, Laguna. Be friendly, helpful, and provide detailed recommendations."
      },
      {
        role: "user",
        content: messageContent
      }
    ]
  })
});




      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const leoResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.choices[0]?.message?.content || 'Sorry, I could not generate a response.',
        sender: 'leo',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, leoResponse]);
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        sender: 'leo',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleWhereAmI = () => {
    if (isGuest) {
      const blockedMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Location services are only available for registered users. Please sign in to access this feature.',
        sender: 'leo',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, blockedMessage]);
      return;
    }

    if (!navigator.geolocation) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Geolocation is not supported by your browser.',
        sender: 'leo',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get location name from coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const locationName = data.display_name || 'your current location';
          
          const locationMessage: Message = {
            id: Date.now().toString(),
            content: `I see you're at ${locationName}. How can I help you with travel recommendations in this area?`,
            sender: 'leo',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, locationMessage]);
        } catch (error) {
          console.error('Error getting location name:', error);
          const locationMessage: Message = {
            id: Date.now().toString(),
            content: `I've detected your location (Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}). How can I help you with travel recommendations in this area?`,
            sender: 'leo',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, locationMessage]);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Unable to access your location. Please make sure location services are enabled.',
          sender: 'leo',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Lakbay AI Travel Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Ask Lakbay anything about tourist spots, accommodations, or travel tips in Cabuyao, Laguna!
            </p>
            {isGuest && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-1 rounded-full">
                <Lock className="h-3 w-3" />
                Sign in required
              </div>
            )}
          </div>
          
          {/* Chat Messages */}
          <ScrollArea className="h-64 w-full rounded-lg border bg-muted/30 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'leo' && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border'
                    }`}
                  >
                    {message.content}
                    {message.imageUrl && (
                      <div className="mt-2">
                        <img 
                          src={message.imageUrl} 
                          alt="Uploaded" 
                          className="max-w-full h-auto rounded-md max-h-32 object-cover"
                        />
                      </div>
                    )}
                  </div>
                  {message.sender === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-secondary" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-background border rounded-lg px-3 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 w-20 object-cover rounded-md border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Chat Input and Actions */}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              disabled={isLoading || isGuest}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isGuest}
              className="flex-shrink-0"
            >
              <Camera className="h-4 w-4" />
            </Button>
            <Input
              placeholder={isGuest ? "Sign in to chat with Lakbay..." : "Ask Lakbay about travel recommendations..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isLoading || isGuest}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={(!inputValue.trim() && !selectedImage) || isLoading || isGuest}
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('What are the best tourist spots in Cabuyao?')}
              disabled={isLoading || isGuest}
            >
              Tourist Spots
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('Where can I stay in Cabuyao?')}
              disabled={isLoading || isGuest}
            >
              Accommodations
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('How do I get around Cabuyao?')}
              disabled={isLoading || isGuest}
            >
              Transportation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhereAmI}
              disabled={isLoading || isGuest}
              className="flex items-center gap-1"
            >
              <MapPin className="h-3 w-3" />
              Where am I?
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}