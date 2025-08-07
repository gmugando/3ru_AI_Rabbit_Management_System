import { createClient } from '@supabase/supabase-js';

class PdfAgent {
  constructor(openaiApiKey, supabaseUrl = null, supabaseKey = null) {
    this.openaiApiKey = openaiApiKey;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.documents = new Map(); // Store loaded documents
    this.documentContent = '';
    this.uploadedDocuments = [];
    this.supabase = null;
    
    console.log('PdfAgent - API key:', openaiApiKey ? 'Present' : 'Missing');
    
    // Initialize Supabase if credentials provided
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async initialize() {
    try {
      // Load rabbit care knowledge (default content)
      await this.loadRabbitCareKnowledge();
      
      // Load uploaded documents from Supabase if available
      if (this.supabase) {
        await this.loadUploadedDocuments();
      }
      
      console.log('PDF Agent initialized successfully');
    } catch (error) {
      console.error('Error initializing PDF Agent:', error);
      throw error;
    }
  }

  async processQuery(query) {
    try {
      if (!this.documentContent) {
        await this.initialize();
      }

      const answer = await this.queryDocuments(query);
      
      return {
        success: true,
        answer: answer,
        sources: this.getRelevantSources(query),
        agent: 'pdf',
        originalQuery: query
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        agent: 'pdf',
        originalQuery: query
      };
    }
  }

  async loadRabbitCareKnowledge() {
    // Mock rabbit care knowledge - in production this would come from actual PDFs
    this.documentContent = `
RABBIT CARE MANUAL

HOUSING REQUIREMENTS:
- Temperature: Maintain between 60-70°F (15-21°C)
- Humidity: Keep between 30-70%
- Ventilation: Ensure good air circulation without drafts
- Space: Minimum 4 square feet per adult rabbit
- Flooring: Wire mesh with solid rest areas to prevent sore hocks

FEEDING GUIDELINES:
- Pellets: 1/4 to 1/2 cup per 5 pounds body weight daily
- Hay: Unlimited timothy hay for adults, alfalfa for growing rabbits
- Fresh vegetables: 2-4 cups per 6 pounds body weight daily
- Water: Fresh water available at all times
- Treats: Limited fruits and high-sugar vegetables

BREEDING BEST PRACTICES:
- Breeding age: Does 6-8 months, Bucks 7-8 months
- Gestation period: 28-31 days (average 31 days)
- Kindling preparation: Provide nest box 3-4 days before due date
- Breeding frequency: Allow 35-42 days between kindlings
- Breeding success rates: 70-85% is considered normal
- Kit survival rates: 80-90% survival to weaning is typical

HEALTH MONITORING:
- Daily observation for appetite, behavior, droppings
- Weekly weight checks for growing rabbits
- Monthly health assessments for breeding stock
- Vaccination schedule: Follow local veterinary recommendations
- Common signs of illness: Loss of appetite, lethargy, abnormal droppings, discharge

ENVIRONMENTAL MANAGEMENT:
- Seasonal adjustments: Extra ventilation in summer, wind protection in winter
- Breeding considerations: Avoid breeding during extreme weather
- Feed adjustments: Increase feed in cold weather, ensure fresh cool water in heat
- Stress factors: Minimize noise, sudden changes, overcrowding

GENETIC CONSIDERATIONS:
- Maintain breeding records for 3+ generations
- Avoid inbreeding: Don't breed closely related rabbits
- Selection criteria: Health, growth rate, reproductive performance
- Culling decisions: Remove poor performers from breeding program

BIOSECURITY:
- Quarantine new rabbits for 2-3 weeks
- Regular cleaning and disinfection schedules
- Visitor restrictions and sanitation protocols
- Disease prevention through vaccination and health monitoring
`;
  }

  async loadUploadedDocuments() {
    if (!this.supabase) return;
    
    try {
      console.log('Loading uploaded documents from Supabase...');
      
      const { data: documents, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('processing_status', 'completed')
        .eq('is_archived', false)
        .order('uploaded_at', { ascending: false });
      
      if (error) {
        console.error('Error loading uploaded documents:', error);
        return;
      }
      
      this.uploadedDocuments = documents || [];
      console.log(`Loaded ${this.uploadedDocuments.length} uploaded documents`);
      
      // Combine all extracted text for searching
      const uploadedContent = this.uploadedDocuments
        .map(doc => `
DOCUMENT: ${doc.title || doc.original_filename}
CATEGORY: ${doc.category}
DESCRIPTION: ${doc.description || 'No description available'}
CONTENT: ${doc.extracted_text || 'Text not yet extracted'}
---
`)
        .join('\n');
      
      if (uploadedContent) {
        this.documentContent += '\n\nUPLOADED DOCUMENTS:\n' + uploadedContent;
      }
      
    } catch (error) {
      console.error('Error loading uploaded documents:', error);
    }
  }

  async queryDocuments(query) {
    try {
      // Use direct OpenAI call to avoid LangChain private member issues
      const systemPrompt = `You are a rabbit farming expert with access to comprehensive rabbit care manuals and breeding guides. 

Your role is to provide accurate, practical advice based on established rabbit care practices. 

Guidelines:
1. Answer questions based on the provided document content
2. Be specific and practical in your recommendations
3. Include relevant details like temperatures, timeframes, quantities
4. If the document doesn't contain specific information, clearly state that
5. Focus on best practices for rabbit health, breeding, and management
6. Use proper rabbit farming terminology
7. Provide actionable advice that farmers can implement

Always prioritize rabbit welfare and established veterinary guidelines.`;

      const userPrompt = `Based on the following rabbit care manual content, please answer this question: "${query}"

RABBIT CARE MANUAL CONTENT:
${this.documentContent}

Question: ${query}

Please provide a detailed, practical answer based on the manual content above. If the manual doesn't contain specific information to answer the question, please state that clearly.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0].message.content.trim();
      
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  // Future method for actual PDF loading from files
  async loadDocumentsFromFiles(pdfPaths) {
    // For future implementation with actual PDF files
    // Note: PDF loading requires additional packages and setup
    console.log('PDF loading from files not yet implemented');
    console.log('Requested paths:', pdfPaths);
    
    // For now, we'll just add the file names to our document content
    const fileInfo = pdfPaths.map(path => `Document: ${path}`).join('\n');
    this.documentContent += `\n\nAvailable Documents:\n${fileInfo}`;
  }

  // Helper method to add more document content
  addDocumentContent(title, content) {
    this.documents.set(title, content);
    this.documentContent += `\n\n${title}:\n${content}`;
  }

  // Get available documents
  getAvailableDocuments() {
    return Array.from(this.documents.keys());
  }

  getRelevantSources(query) {
    const sources = ['Built-in Rabbit Care Manual'];
    
    // Add uploaded document sources
    if (this.uploadedDocuments && this.uploadedDocuments.length > 0) {
      const relevantDocs = this.uploadedDocuments
        .filter(doc => {
          const queryLower = query.toLowerCase();
          const docText = `${doc.title} ${doc.description} ${doc.extracted_text}`.toLowerCase();
          return docText.includes(queryLower.split(' ')[0]) || 
                 doc.category.toLowerCase().includes(queryLower);
        })
        .slice(0, 5); // Limit to top 5 relevant documents
      
      relevantDocs.forEach(doc => {
        sources.push(doc.title || doc.original_filename);
      });
    }
    
    return sources;
  }
}

export default PdfAgent; 