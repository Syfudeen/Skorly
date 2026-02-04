const axios = require('axios');
const { PLATFORMS, PLATFORM_APIS, ERROR_TYPES } = require('../utils/constants');
const { retryWithBackoff, sleep } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Platform Service
 * Handles API calls to different coding platforms
 */
class PlatformService {
  constructor() {
    this.rateLimiters = new Map();
    this.initializeRateLimiters();
  }

  /**
   * Initialize rate limiters for each platform
   */
  initializeRateLimiters() {
    Object.entries(PLATFORM_APIS).forEach(([platform, config]) => {
      this.rateLimiters.set(platform, {
        requests: [],
        limit: config.RATE_LIMIT,
        window: 1000 // 1 second window
      });
    });
  }

  /**
   * Check and enforce rate limiting
   */
  async enforceRateLimit(platform) {
    const limiter = this.rateLimiters.get(platform);
    if (!limiter) return;

    const now = Date.now();
    
    // Remove old requests outside the window
    limiter.requests = limiter.requests.filter(
      timestamp => now - timestamp < limiter.window
    );

    // Check if we've hit the rate limit
    if (limiter.requests.length >= limiter.limit) {
      const oldestRequest = Math.min(...limiter.requests);
      const waitTime = limiter.window - (now - oldestRequest);
      
      if (waitTime > 0) {
        logger.debug('⏳ Rate limit enforced', { 
          platform, 
          waitTime: `${waitTime}ms` 
        });
        await sleep(waitTime);
      }
    }

    // Add current request
    limiter.requests.push(now);
  }

  /**
   * Fetch stats for a student from all platforms
   */
  async fetchStudentStats(student, uploadJobId) {
    const results = {
      regNo: student.regNo,
      name: student.name,
      platforms: {},
      errors: [],
      totalPlatforms: 0,
      successfulPlatforms: 0,
      failedPlatforms: 0
    };

    const platformPromises = [];

    // Create promises for each platform
    Object.entries(student.platformIds).forEach(([platform, platformId]) => {
      if (platformId && platformId.trim() !== '') {
        results.totalPlatforms++;
        
        const promise = this.fetchPlatformStats(platform, platformId)
          .then(stats => {
            results.platforms[platform] = {
              ...stats,
              fetchStatus: 'success'
            };
            results.successfulPlatforms++;
          })
          .catch(error => {
            results.platforms[platform] = {
              rating: 0,
              maxRating: 0,
              problemsSolved: 0,
              contestsParticipated: 0,
              rank: null,
              fetchStatus: 'failed',
              error: error.message
            };
            results.errors.push({
              platform,
              platformId,
              error: error.message
            });
            results.failedPlatforms++;
          });

        platformPromises.push(promise);
      }
    });

    // Wait for all platform requests to complete
    await Promise.allSettled(platformPromises);

    logger.studentProcessing(
      student.regNo,
      'all',
      'completed',
      {
        totalPlatforms: results.totalPlatforms,
        successful: results.successfulPlatforms,
        failed: results.failedPlatforms
      }
    );

    return results;
  }

  /**
   * Fetch stats from a specific platform
   */
  async fetchPlatformStats(platform, platformId) {
    const startTime = Date.now();
    
    try {
      await this.enforceRateLimit(platform);

      let stats;
      switch (platform) {
        case PLATFORMS.CODEFORCES:
          stats = await this.fetchCodeforcesStats(platformId);
          break;
        case PLATFORMS.LEETCODE:
          stats = await this.fetchLeetCodeStats(platformId);
          break;
        case PLATFORMS.CODECHEF:
          stats = await this.fetchCodeChefStats(platformId);
          break;
        case PLATFORMS.ATCODER:
          stats = await this.fetchAtCoderStats(platformId);
          break;
        case PLATFORMS.CODOLIO:
          stats = await this.fetchCodolioStats(platformId);
          break;
        case PLATFORMS.GITHUB:
          stats = await this.fetchGitHubStats(platformId);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      const duration = Date.now() - startTime;
      logger.apiCall(platform, platformId, 'success', duration);

      return stats;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.apiCall(platform, platformId, 'failed', duration, error.message);
      throw error;
    }
  }

  /**
   * Fetch Codeforces stats (Official API)
   */
  async fetchCodeforcesStats(handle) {
    return retryWithBackoff(async () => {
      const config = PLATFORM_APIS[PLATFORMS.CODEFORCES];
      
      try {
        // Fetch user info
        const userInfoResponse = await axios.get(
          `${config.BASE_URL}${config.USER_INFO}`,
          {
            params: { handles: handle },
            timeout: config.TIMEOUT,
            headers: {
              'User-Agent': 'Skorly-Platform-Tracker/1.0'
            }
          }
        );

        if (userInfoResponse.data.status !== 'OK') {
          throw new Error(`Codeforces API error: ${userInfoResponse.data.comment}`);
        }

        const userInfo = userInfoResponse.data.result[0];
        
        // Fetch user submissions to count solved problems
        const userStatusResponse = await axios.get(
          `${config.BASE_URL}${config.USER_STATUS}`,
          {
            params: { 
              handle: handle,
              from: 1,
              count: 10000 // Get all submissions
            },
            timeout: config.TIMEOUT,
            headers: {
              'User-Agent': 'Skorly-Platform-Tracker/1.0'
            }
          }
        );

        let problemsSolved = 0;
        if (userStatusResponse.data.status === 'OK') {
          const acceptedSubmissions = userStatusResponse.data.result.filter(
            submission => submission.verdict === 'OK'
          );
          
          // Count unique problems solved
          const uniqueProblems = new Set();
          acceptedSubmissions.forEach(submission => {
            const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
            uniqueProblems.add(problemKey);
          });
          
          problemsSolved = uniqueProblems.size;
        }

        return {
          rating: userInfo.rating || 0,
          maxRating: userInfo.maxRating || userInfo.rating || 0,
          problemsSolved,
          contestsParticipated: userInfo.contribution || 0,
          rank: userInfo.rank || null,
          additionalData: {
            handle: userInfo.handle,
            country: userInfo.country || null,
            city: userInfo.city || null,
            organization: userInfo.organization || null,
            titlePhoto: userInfo.titlePhoto || null
          }
        };

      } catch (error) {
        if (error.response?.status === 400) {
          throw new Error(`Invalid Codeforces handle: ${handle}`);
        }
        if (error.response?.status === 503) {
          throw new Error('Codeforces API temporarily unavailable');
        }
        throw new Error(`Codeforces API error: ${error.message}`);
      }
    }, 3, 2000);
  }

  /**
   * Fetch LeetCode stats (GraphQL API)
   */
  async fetchLeetCodeStats(username) {
    return retryWithBackoff(async () => {
      const config = PLATFORM_APIS[PLATFORMS.LEETCODE];
      
      try {
        const query = `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              profile {
                ranking
                userAvatar
                realName
                aboutMe
                school
                websites
                countryName
                company
                jobTitle
                skillTags
                postViewCount
                postViewCountDiff
                reputation
                reputationDiff
              }
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                  submissions
                }
                totalSubmissionNum {
                  difficulty
                  count
                  submissions
                }
              }
              badges {
                id
                displayName
                icon
                creationDate
              }
            }
            userContestRanking(username: $username) {
              attendedContestsCount
              rating
              globalRanking
              totalParticipants
              topPercentage
              badge {
                name
              }
            }
          }
        `;

        const response = await axios.post(
          config.BASE_URL,
          {
            query,
            variables: { username }
          },
          {
            timeout: config.TIMEOUT,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Skorly-Platform-Tracker/1.0',
              'Referer': 'https://leetcode.com'
            }
          }
        );

        const data = response.data.data;
        
        if (!data.matchedUser) {
          throw new Error(`LeetCode user not found: ${username}`);
        }

        const user = data.matchedUser;
        const contestRanking = data.userContestRanking;
        
        // Calculate total problems solved
        let totalSolved = 0;
        if (user.submitStats?.acSubmissionNum) {
          user.submitStats.acSubmissionNum.forEach(stat => {
            totalSolved += stat.count;
          });
        }

        return {
          rating: Math.round(contestRanking?.rating || 0),
          maxRating: Math.round(contestRanking?.rating || 0), // LeetCode doesn't provide max rating
          problemsSolved: totalSolved,
          contestsParticipated: contestRanking?.attendedContestsCount || 0,
          rank: contestRanking?.globalRanking || null,
          additionalData: {
            username: user.username,
            ranking: user.profile?.ranking || null,
            reputation: user.profile?.reputation || 0,
            badges: user.badges?.length || 0,
            company: user.profile?.company || null,
            school: user.profile?.school || null
          }
        };

      } catch (error) {
        if (error.response?.status === 403) {
          throw new Error('LeetCode API access forbidden');
        }
        if (error.response?.status === 429) {
          throw new Error('LeetCode API rate limit exceeded');
        }
        throw new Error(`LeetCode API error: ${error.message}`);
      }
    }, 3, 3000);
  }

  /**
   * Fetch CodeChef stats (Web scraping with controlled approach)
   */
  async fetchCodeChefStats(username) {
    return retryWithBackoff(async () => {
      try {
        const cheerio = require('cheerio');
        
        const response = await axios.get(
          `https://www.codechef.com/users/${username}`,
          {
            timeout: PLATFORM_APIS[PLATFORMS.CODECHEF].TIMEOUT,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            }
          }
        );

        const $ = cheerio.load(response.data);
        
        // Extract rating
        let rating = 0;
        let maxRating = 0;
        const ratingText = $('.rating-number').first().text().trim();
        if (ratingText) {
          rating = parseInt(ratingText) || 0;
        }
        
        // Try to get max rating from the rating header
        const ratingHeader = $('.rating-header').text();
        const maxRatingMatch = ratingHeader.match(/Highest Rating (\d+)/);
        if (maxRatingMatch) {
          maxRating = parseInt(maxRatingMatch[1]) || rating;
        } else {
          maxRating = rating;
        }
        
        // Extract problems solved
        let problemsSolved = 0;
        $('.problems-solved h3').each((i, elem) => {
          const text = $(elem).text().trim();
          const match = text.match(/(\d+)/);
          if (match) {
            problemsSolved = parseInt(match[1]) || 0;
          }
        });
        
        // If not found, try alternative selector
        if (problemsSolved === 0) {
          const problemsText = $('section.rating-data-section h3').first().text();
          const problemsMatch = problemsText.match(/(\d+)/);
          if (problemsMatch) {
            problemsSolved = parseInt(problemsMatch[1]) || 0;
          }
        }
        
        // Extract contests participated
        let contestsParticipated = 0;
        $('.contest-participated-count b').each((i, elem) => {
          const text = $(elem).text().trim();
          const match = text.match(/(\d+)/);
          if (match) {
            contestsParticipated = parseInt(match[1]) || 0;
          }
        });
        
        // Extract global rank
        let rank = null;
        const rankText = $('.rating-ranks li').first().find('a').text().trim();
        const rankMatch = rankText.match(/(\d+)/);
        if (rankMatch) {
          rank = parseInt(rankMatch[1]) || null;
        }
        
        // Extract country
        let country = null;
        $('.user-country-name').each((i, elem) => {
          country = $(elem).text().trim();
        });
        
        // Extract institution
        let institution = null;
        $('.user-institution').each((i, elem) => {
          institution = $(elem).text().trim();
        });

        return {
          rating,
          maxRating,
          problemsSolved,
          contestsParticipated,
          rank,
          additionalData: {
            username,
            country,
            institution
          }
        };

      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(`CodeChef user not found: ${username}`);
        }
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new Error('CodeChef request timeout - site may be slow');
        }
        throw new Error(`CodeChef scraping error: ${error.message}`);
      }
    }, 2, 5000);
  }

  /**
   * Fetch AtCoder stats
   */
  async fetchAtCoderStats(username) {
    return retryWithBackoff(async () => {
      try {
        // AtCoder doesn't have an official API
        // This would require web scraping or using unofficial APIs
        // Placeholder implementation
        
        return {
          rating: 0,
          maxRating: 0,
          problemsSolved: 0,
          contestsParticipated: 0,
          rank: null,
          additionalData: {
            username
          }
        };

      } catch (error) {
        throw new Error(`AtCoder API error: ${error.message}`);
      }
    }, 2, 3000);
  }

  /**
   * Fetch Codolio stats
   */
  async fetchCodolioStats(username) {
    return retryWithBackoff(async () => {
      try {
        // Codolio API implementation would go here
        // Placeholder implementation
        
        return {
          rating: 0,
          maxRating: 0,
          problemsSolved: 0,
          contestsParticipated: 0,
          rank: null,
          additionalData: {
            username
          }
        };

      } catch (error) {
        throw new Error(`Codolio API error: ${error.message}`);
      }
    }, 2, 3000);
  }

  /**
   * Fetch GitHub stats
   */
  async fetchGitHubStats(username) {
    return retryWithBackoff(async () => {
      const config = PLATFORM_APIS[PLATFORMS.GITHUB];
      
      try {
        // Fetch user info
        const userResponse = await axios.get(
          `${config.BASE_URL}/users/${username}`,
          {
            timeout: config.TIMEOUT,
            headers: {
              'User-Agent': 'Skorly-Platform-Tracker/1.0',
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        const user = userResponse.data;

        // Fetch repositories
        const reposResponse = await axios.get(
          `${config.BASE_URL}/users/${username}/repos`,
          {
            params: {
              type: 'owner',
              sort: 'updated',
              per_page: 100
            },
            timeout: config.TIMEOUT,
            headers: {
              'User-Agent': 'Skorly-Platform-Tracker/1.0',
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        const repos = reposResponse.data;
        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

        return {
          rating: totalStars, // Use stars as rating
          maxRating: totalStars,
          problemsSolved: user.public_repos, // Use public repos as problems solved
          contestsParticipated: 0, // GitHub doesn't have contests
          rank: null,
          additionalData: {
            username: user.login,
            name: user.name,
            company: user.company,
            location: user.location,
            email: user.email,
            bio: user.bio,
            publicRepos: user.public_repos,
            publicGists: user.public_gists,
            followers: user.followers,
            following: user.following,
            totalStars,
            totalForks,
            createdAt: user.created_at
          }
        };

      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(`GitHub user not found: ${username}`);
        }
        if (error.response?.status === 403) {
          throw new Error('GitHub API rate limit exceeded');
        }
        throw new Error(`GitHub API error: ${error.message}`);
      }
    }, 3, 2000);
  }

  /**
   * Test platform connectivity
   */
  async testPlatformConnectivity() {
    const results = {};

    for (const platform of Object.values(PLATFORMS)) {
      try {
        const startTime = Date.now();
        
        // Test with a known user for each platform
        const testUsers = {
          [PLATFORMS.CODEFORCES]: 'tourist',
          [PLATFORMS.LEETCODE]: 'LeetCode',
          [PLATFORMS.CODECHEF]: 'admin',
          [PLATFORMS.GITHUB]: 'octocat'
        };

        const testUser = testUsers[platform];
        if (testUser) {
          await this.fetchPlatformStats(platform, testUser);
          results[platform] = {
            status: 'success',
            responseTime: Date.now() - startTime
          };
        } else {
          results[platform] = {
            status: 'skipped',
            reason: 'No test user defined'
          };
        }

      } catch (error) {
        results[platform] = {
          status: 'failed',
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Get rate limiter status
   */
  getRateLimiterStatus() {
    const status = {};
    
    this.rateLimiters.forEach((limiter, platform) => {
      const now = Date.now();
      const recentRequests = limiter.requests.filter(
        timestamp => now - timestamp < limiter.window
      );
      
      status[platform] = {
        recentRequests: recentRequests.length,
        limit: limiter.limit,
        remainingRequests: Math.max(0, limiter.limit - recentRequests.length),
        resetTime: recentRequests.length > 0 
          ? new Date(Math.min(...recentRequests) + limiter.window)
          : new Date()
      };
    });

    return status;
  }
}

module.exports = new PlatformService();