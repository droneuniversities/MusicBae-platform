const { logger } = require('./security');
const crypto = require('crypto');

class SecurityMonitor {
  constructor() {
    this.securityEvents = [];
    this.threatLevel = 'low';
    this.blockedIPs = new Set();
    this.suspiciousActivities = new Map();
    this.rateLimitViolations = new Map();
    this.failedLoginAttempts = new Map();
    this.maxEvents = 1000;
    this.alertThresholds = {
      failedLogins: 10,
      rateLimitViolations: 20,
      suspiciousActivities: 5,
      securityEvents: 50
    };
  }

  // Log security event
  logSecurityEvent(event) {
    const securityEvent = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date(),
      type: event.type,
      severity: event.severity || 'medium',
      ip: event.ip,
      userAgent: event.userAgent,
      userId: event.userId,
      details: event.details,
      action: event.action || 'logged'
    };

    this.securityEvents.push(securityEvent);

    // Keep only the latest events
    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents = this.securityEvents.slice(-this.maxEvents);
    }

    // Log to file
    logger.warn('Security event detected', securityEvent);

    // Check for threats
    this.assessThreatLevel();
    
    // Send alerts if necessary
    this.checkAndSendAlerts(securityEvent);

    return securityEvent;
  }

  // Track failed login attempts
  trackFailedLogin(ip, userId, email) {
    const key = `${ip}-${email}`;
    const attempts = this.failedLoginAttempts.get(key) || 0;
    this.failedLoginAttempts.set(key, attempts + 1);

    this.logSecurityEvent({
      type: 'failed_login',
      severity: attempts > 5 ? 'high' : 'medium',
      ip,
      userId,
      details: { email, attempts: attempts + 1 },
      action: 'tracked'
    });

    // Block IP if too many failed attempts
    if (attempts >= 10) {
      this.blockIP(ip, 'Too many failed login attempts');
    }
  }

  // Track rate limit violations
  trackRateLimitViolation(ip, endpoint) {
    const key = `${ip}-${endpoint}`;
    const violations = this.rateLimitViolations.get(key) || 0;
    this.rateLimitViolations.set(key, violations + 1);

    this.logSecurityEvent({
      type: 'rate_limit_violation',
      severity: violations > 5 ? 'high' : 'medium',
      ip,
      details: { endpoint, violations: violations + 1 },
      action: 'tracked'
    });

    // Block IP if too many violations
    if (violations >= 20) {
      this.blockIP(ip, 'Too many rate limit violations');
    }
  }

  // Track suspicious activities
  trackSuspiciousActivity(ip, activity, details) {
    const key = `${ip}-${activity}`;
    const count = this.suspiciousActivities.get(key) || 0;
    this.suspiciousActivities.set(key, count + 1);

    this.logSecurityEvent({
      type: 'suspicious_activity',
      severity: count > 3 ? 'high' : 'medium',
      ip,
      details: { activity, count: count + 1, ...details },
      action: 'tracked'
    });

    // Block IP if too many suspicious activities
    if (count >= 10) {
      this.blockIP(ip, 'Too many suspicious activities');
    }
  }

  // Block IP address
  blockIP(ip, reason) {
    this.blockedIPs.add(ip);
    
    this.logSecurityEvent({
      type: 'ip_blocked',
      severity: 'high',
      ip,
      details: { reason },
      action: 'blocked'
    });

    logger.error(`IP address blocked: ${ip}`, { reason });
  }

  // Unblock IP address
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    
    this.logSecurityEvent({
      type: 'ip_unblocked',
      severity: 'low',
      ip,
      details: { reason: 'Manual unblock' },
      action: 'unblocked'
    });

    logger.info(`IP address unblocked: ${ip}`);
  }

  // Check if IP is blocked
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  // Assess overall threat level
  assessThreatLevel() {
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    const highSeverityEvents = recentEvents.filter(event => event.severity === 'high').length;
    const mediumSeverityEvents = recentEvents.filter(event => event.severity === 'medium').length;

    if (highSeverityEvents > 10 || mediumSeverityEvents > 50) {
      this.threatLevel = 'critical';
    } else if (highSeverityEvents > 5 || mediumSeverityEvents > 20) {
      this.threatLevel = 'high';
    } else if (highSeverityEvents > 2 || mediumSeverityEvents > 10) {
      this.threatLevel = 'medium';
    } else {
      this.threatLevel = 'low';
    }

    logger.info(`Threat level assessed: ${this.threatLevel}`, {
      highSeverityEvents,
      mediumSeverityEvents,
      totalEvents: recentEvents.length
    });
  }

  // Check and send alerts
  checkAndSendAlerts(event) {
    const shouldAlert = 
      event.severity === 'high' ||
      event.severity === 'critical' ||
      this.threatLevel === 'high' ||
      this.threatLevel === 'critical';

    if (shouldAlert) {
      this.sendSecurityAlert(event);
    }
  }

  // Send security alert
  sendSecurityAlert(event) {
    const alert = {
      timestamp: new Date(),
      threatLevel: this.threatLevel,
      event: event,
      summary: this.getSecuritySummary()
    };

    // Log alert
    logger.error('SECURITY ALERT', alert);

    // In production, you would send this to:
    // - Email notifications
    // - Slack/Discord webhooks
    // - Security monitoring services
    // - SMS alerts for critical events

    console.error('🚨 SECURITY ALERT 🚨');
    console.error(`Threat Level: ${this.threatLevel.toUpperCase()}`);
    console.error(`Event Type: ${event.type}`);
    console.error(`IP: ${event.ip}`);
    console.error(`Details:`, event.details);
  }

  // Get security summary
  getSecuritySummary() {
    const last24Hours = this.securityEvents.filter(
      event => event.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    return {
      threatLevel: this.threatLevel,
      totalEvents: this.securityEvents.length,
      eventsLast24Hours: last24Hours.length,
      blockedIPs: this.blockedIPs.size,
      failedLoginAttempts: this.failedLoginAttempts.size,
      rateLimitViolations: this.rateLimitViolations.size,
      suspiciousActivities: this.suspiciousActivities.size,
      highSeverityEvents: last24Hours.filter(e => e.severity === 'high').length,
      mediumSeverityEvents: last24Hours.filter(e => e.severity === 'medium').length,
      lowSeverityEvents: last24Hours.filter(e => e.severity === 'low').length
    };
  }

  // Get security statistics
  getSecurityStats() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      current: {
        threatLevel: this.threatLevel,
        blockedIPs: this.blockedIPs.size,
        activeThreats: this.getActiveThreats()
      },
      lastHour: {
        events: this.securityEvents.filter(e => e.timestamp > lastHour).length,
        failedLogins: this.getFailedLoginsInTimeframe(lastHour),
        rateLimitViolations: this.getRateLimitViolationsInTimeframe(lastHour)
      },
      lastDay: {
        events: this.securityEvents.filter(e => e.timestamp > lastDay).length,
        failedLogins: this.getFailedLoginsInTimeframe(lastDay),
        rateLimitViolations: this.getRateLimitViolationsInTimeframe(lastDay)
      },
      lastWeek: {
        events: this.securityEvents.filter(e => e.timestamp > lastWeek).length,
        failedLogins: this.getFailedLoginsInTimeframe(lastWeek),
        rateLimitViolations: this.getRateLimitViolationsInTimeframe(lastWeek)
      }
    };
  }

  // Get active threats
  getActiveThreats() {
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    );

    return recentEvents.filter(event => 
      event.severity === 'high' || event.severity === 'critical'
    );
  }

  // Get failed logins in timeframe
  getFailedLoginsInTimeframe(since) {
    return this.securityEvents.filter(
      event => event.type === 'failed_login' && event.timestamp > since
    ).length;
  }

  // Get rate limit violations in timeframe
  getRateLimitViolationsInTimeframe(since) {
    return this.securityEvents.filter(
      event => event.type === 'rate_limit_violation' && event.timestamp > since
    ).length;
  }

  // Clear old data
  clearOldData() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp > cutoff
    );

    // Clear old rate limit violations
    for (const [key, violations] of this.rateLimitViolations.entries()) {
      if (violations < 5) {
        this.rateLimitViolations.delete(key);
      }
    }

    // Clear old failed login attempts
    for (const [key, attempts] of this.failedLoginAttempts.entries()) {
      if (attempts < 3) {
        this.failedLoginAttempts.delete(key);
      }
    }

    logger.info('Cleared old security data');
  }

  // Export security report
  exportSecurityReport() {
    return {
      timestamp: new Date(),
      summary: this.getSecuritySummary(),
      stats: this.getSecurityStats(),
      recentEvents: this.securityEvents.slice(-50), // Last 50 events
      blockedIPs: Array.from(this.blockedIPs),
      threatLevel: this.threatLevel
    };
  }
}

// Create singleton instance
const securityMonitor = new SecurityMonitor();

// Clean up old data every hour
setInterval(() => {
  securityMonitor.clearOldData();
}, 60 * 60 * 1000);

module.exports = securityMonitor; 