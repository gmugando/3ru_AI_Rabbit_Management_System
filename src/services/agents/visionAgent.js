import { createClient } from '@supabase/supabase-js';

class VisionAgent {
  constructor(openaiApiKey, supabaseUrl, supabaseKey) {
    this.openaiApiKey = openaiApiKey;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.description = 'Camera vision monitoring, behavior alerts, motion and posture analysis, and cage-level health risk signals';

    this.defaultLimit = 50;
    this.defaultConfidenceThreshold = 0.75;
  }

  async initialize() {
    // Intentionally light for MVP; DB-backed event querying requires no warm-up.
    return true;
  }

  async processQuery(query, options = {}) {
    try {
      const normalizedQuery = typeof query === 'string' ? query : String(query || '');
      const intent = await this.extractIntent(normalizedQuery);

      if (options.snapshotData) {
        return this.processSnapshotPayload(normalizedQuery, options.snapshotData, intent);
      }

      const events = await this.fetchVisionEvents(intent, options);
      const filteredEvents = this.applyClientFilters(events, intent);
      const metrics = this.buildMetrics(filteredEvents);
      const alerts = this.buildAlerts(filteredEvents);
      const summary = this.buildSummary(filteredEvents, metrics, intent, normalizedQuery);

      return {
        success: true,
        agent: 'vision',
        originalQuery: normalizedQuery,
        summary,
        alerts,
        metrics,
        totalEvents: filteredEvents.length,
        confidenceThreshold: intent.confidenceThreshold,
        eventWindowHours: intent.timeWindowHours,
        rawEvents: filteredEvents
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        agent: 'vision',
        originalQuery: typeof query === 'string' ? query : String(query || '')
      };
    }
  }

  async extractIntent(query) {
    const fallback = this.extractIntentFromKeywords(query);

    if (!this.openaiApiKey) {
      return fallback;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an intent parser for rabbit-farm vision monitoring queries.
Return strict JSON with this shape:
{
  "timeWindowHours": number,
  "confidenceThreshold": number,
  "eventTypes": string[],
  "severity": string[]
}
Rules:
- timeWindowHours between 1 and 720
- confidenceThreshold between 0 and 1
- eventTypes values from: low_activity,isolation_detected,abnormal_posture,fur_loss_pattern,nest_risk,kit_outside_nest,aggression_detected,overcrowding_detected,no_feeder_approach
- severity values from: low,medium,high,critical
- If not specified by user, keep empty arrays for eventTypes and severity`
            },
            { role: 'user', content: query }
          ],
          temperature: 0.1,
          max_tokens: 180
        })
      });

      if (!response.ok) {
        return fallback;
      }

      const result = await response.json();
      const content = (result?.choices?.[0]?.message?.content || '').replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(content);

      return {
        timeWindowHours: this.clampNumber(parsed.timeWindowHours, 1, 720, fallback.timeWindowHours),
        confidenceThreshold: this.clampNumber(parsed.confidenceThreshold, 0, 1, fallback.confidenceThreshold),
        eventTypes: Array.isArray(parsed.eventTypes) ? parsed.eventTypes : fallback.eventTypes,
        severity: Array.isArray(parsed.severity) ? parsed.severity : fallback.severity
      };
    } catch (error) {
      console.warn('VisionAgent: intent extraction fallback due to error:', error.message);
      return fallback;
    }
  }

  extractIntentFromKeywords(query) {
    const lowerQuery = query.toLowerCase();
    const eventTypes = [];
    const severity = [];

    if (lowerQuery.includes('motion') || lowerQuery.includes('activity') || lowerQuery.includes('movement')) {
      eventTypes.push('low_activity');
    }
    if (lowerQuery.includes('isolation') || lowerQuery.includes('alone')) {
      eventTypes.push('isolation_detected');
    }
    if (lowerQuery.includes('posture')) {
      eventTypes.push('abnormal_posture');
    }
    if (lowerQuery.includes('fur') || lowerQuery.includes('hair')) {
      eventTypes.push('fur_loss_pattern');
    }
    if (lowerQuery.includes('nest') || lowerQuery.includes('kit')) {
      eventTypes.push('nest_risk', 'kit_outside_nest');
    }
    if (lowerQuery.includes('aggression') || lowerQuery.includes('fight')) {
      eventTypes.push('aggression_detected');
    }
    if (lowerQuery.includes('overcrowd') || lowerQuery.includes('density')) {
      eventTypes.push('overcrowding_detected');
    }
    if (lowerQuery.includes('feeder') || lowerQuery.includes('feed')) {
      eventTypes.push('no_feeder_approach');
    }

    if (lowerQuery.includes('critical')) severity.push('critical');
    if (lowerQuery.includes('high')) severity.push('high');

    let timeWindowHours = 24;
    if (lowerQuery.includes('today')) timeWindowHours = 24;
    if (lowerQuery.includes('last 7 days') || lowerQuery.includes('this week')) timeWindowHours = 24 * 7;
    if (lowerQuery.includes('last month') || lowerQuery.includes('30 days')) timeWindowHours = 24 * 30;

    return {
      timeWindowHours,
      confidenceThreshold: this.defaultConfidenceThreshold,
      eventTypes: [...new Set(eventTypes)],
      severity: [...new Set(severity)]
    };
  }

  async fetchVisionEvents(intent, options) {
    const limit = options.limit || this.defaultLimit;
    const since = new Date(Date.now() - intent.timeWindowHours * 60 * 60 * 1000).toISOString();

    let dbQuery = this.supabase
      .from('vision_events')
      .select('id, event_type, severity, confidence, event_time, source_camera_id, cage_id, rabbit_id, status, metadata')
      .gte('event_time', since)
      .gte('confidence', intent.confidenceThreshold)
      .order('event_time', { ascending: false })
      .limit(limit);

    if (intent.eventTypes.length > 0) {
      dbQuery = dbQuery.in('event_type', intent.eventTypes);
    }
    if (intent.severity.length > 0) {
      dbQuery = dbQuery.in('severity', intent.severity);
    }

    const { data, error } = await dbQuery;
    if (error) {
      throw new Error(`Vision events query failed: ${error.message}`);
    }

    return data || [];
  }

  applyClientFilters(events, intent) {
    return events.filter(event => {
      if (!event) return false;
      if (event.confidence < intent.confidenceThreshold) return false;
      return true;
    });
  }

  buildMetrics(events) {
    const byType = {};
    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };

    events.forEach(event => {
      byType[event.event_type] = (byType[event.event_type] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      byType,
      bySeverity
    };
  }

  buildAlerts(events) {
    return events.slice(0, 10).map(event => ({
      id: event.id,
      event_type: event.event_type,
      severity: event.severity,
      confidence: event.confidence,
      rabbit_id: event.rabbit_id,
      cage_id: event.cage_id,
      event_time: event.event_time,
      recommendation: this.recommendationForEventType(event.event_type, event.severity)
    }));
  }

  buildSummary(events, metrics, intent, query) {
    if (events.length === 0) {
      return `No vision alerts matched this query in the last ${intent.timeWindowHours} hour(s) at confidence >= ${intent.confidenceThreshold}.`;
    }

    const topTypes = Object.entries(metrics.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => `${type.replace(/_/g, ' ')} (${count})`);

    return `Detected ${events.length} vision event(s) in the last ${intent.timeWindowHours} hour(s) for "${query}". Top signals: ${topTypes.join(', ')}.`;
  }

  processSnapshotPayload(query, snapshotData, intent) {
    // Placeholder hook for Phase 2: integrate real image/video inference.
    return {
      success: true,
      agent: 'vision',
      originalQuery: query,
      summary: 'Snapshot mode is connected as an MVP hook. Full model inference will be enabled in Phase 2.',
      alerts: [],
      metrics: {
        totalEvents: 0,
        byType: {},
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 }
      },
      snapshotMode: true,
      snapshotBytes: typeof snapshotData === 'string' ? snapshotData.length : 0,
      confidenceThreshold: intent.confidenceThreshold
    };
  }

  recommendationForEventType(eventType, severity) {
    const recommendations = {
      low_activity: 'Inspect rabbit activity and feeder/water access within 12 hours.',
      isolation_detected: 'Check social isolation and possible illness indicators immediately.',
      abnormal_posture: 'Perform a physical check for injury or pain signs as soon as possible.',
      fur_loss_pattern: 'Inspect skin and fur condition, then isolate if contagious causes are suspected.',
      nest_risk: 'Check nest box condition and maternal behavior now.',
      kit_outside_nest: 'Return kits to nest and verify nest warmth immediately.',
      aggression_detected: 'Separate aggressive animals and review overcrowding or stress factors.',
      overcrowding_detected: 'Reduce cage density and monitor stress markers.',
      no_feeder_approach: 'Check feed quality and rabbit appetite; inspect for early illness.'
    };

    const base = recommendations[eventType] || 'Review camera footage and inspect rabbit/cage conditions.';
    if (severity === 'critical') {
      return `Critical priority: ${base}`;
    }
    return base;
  }

  clampNumber(value, min, max, fallback) {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return fallback;
    return Math.min(max, Math.max(min, numberValue));
  }
}

export default VisionAgent;
