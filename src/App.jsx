import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import ChatBot from './components/ChatBot';
import DataUploader from './components/DataUploader';

const ScaleUpHub = () => {
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [searchSuggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [apiLogs, setApiLogs] = useState([]);
  const [createdObjects, setCreatedObjects] = useState([]);

  const API_BASE = 'https://builder.empromptu.ai/api_tools';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer da9b167265262b9cd717a29829987add',
    'X-Generated-App-ID': 'af942dc7-53a0-41c6-9a00-43064285d940',
    'X-Usage-Key': '888d040f8c45f81f8fe3d182268520ce'
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const logApiCall = (endpoint, method, payload, response) => {
    const log = {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      payload,
      response,
      id: Date.now()
    };
    setApiLogs(prev => [log, ...prev.slice(0, 9)]);
  };

  const apiCall = async (endpoint, method = 'POST', payload = null) => {
    try {
      const options = {
        method,
        headers,
        ...(payload && { body: JSON.stringify(payload) })
      };
      
      const response = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await response.json();
      
      logApiCall(endpoint, method, payload, data);
      return data;
    } catch (error) {
      logApiCall(endpoint, method, payload, { error: error.message });
      throw error;
    }
  };

  const initializeData = async () => {
    setLoading(true);
    try {
      await createInitialData();
      
      const categories = [
        'Finance & Accounting software for Indian SMEs',
        'Sales & Marketing tools for Indian small businesses',
        'Operations management solutions for Indian SMEs',
        'HR management software for Indian small businesses',
        'Inventory management systems for Indian SMEs',
        'Digital marketing courses for Indian entrepreneurs',
        'Financial planning experts for Indian SMEs',
        'Business automation consultants for Indian companies'
      ];

      for (const category of categories) {
        await researchCategory(category);
      }

      await loadListings();
      await loadReviews();
      
    } catch (error) {
      console.error('Error initializing data:', error);
    }
    setLoading(false);
  };

  const createInitialData = async () => {
    const suggestions = [
      'Improve Cash Flow', 'Automate Invoicing', 'Manage Inventory', 
      'Digital Marketing', 'Customer Management', 'Payroll Processing',
      'Tax Compliance', 'Sales Tracking', 'Employee Management',
      'Financial Planning', 'Business Analytics', 'Online Presence'
    ];

    const result = await apiCall('/input_data', 'POST', {
      created_object_name: 'search_suggestions',
      data_type: 'strings',
      input_data: suggestions
    });

    if (result) {
      setCreatedObjects(prev => [...prev, 'search_suggestions']);
    }

    const successStory = {
      company: 'Mumbai Textiles Ltd',
      challenge: 'Manual inventory tracking causing 20% stock wastage',
      solution: 'Implemented AI-powered inventory management system',
      result: 'Reduced wastage by 85% and increased profits by â¹2.5 lakhs monthly',
      quote: 'ScaleUp Hub connected us with the perfect solution. Our business transformed in just 3 months.',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'
    };

    const storyResult = await apiCall('/input_data', 'POST', {
      created_object_name: 'success_stories',
      data_type: 'strings',
      input_data: [JSON.stringify(successStory)]
    });

    if (storyResult) {
      setCreatedObjects(prev => [...prev, 'success_stories']);
    }
  };

  const researchCategory = async (category) => {
    try {
      const researchResult = await apiCall('/rapid_research', 'POST', {
        created_object_name: 'raw_research',
        goal: `Find 5-7 specific ${category} with names, descriptions, pricing, and key features`
      });

      if (researchResult) {
        setCreatedObjects(prev => [...prev, 'raw_research']);
      }

      const processResult = await apiCall('/apply_prompt', 'POST', {
        created_object_names: ['structured_listings'],
        prompt_string: `Convert this research data {raw_research} into JSON format with these fields for each solution:
        {
          "name": "Solution Name",
          "type": "software/course/expert",
          "problem_categories": ["category1", "category2"],
          "description": "Brief description",
          "detailed_overview": "Detailed explanation",
          "pricing": "Pricing info",
          "features": ["feature1", "feature2", "feature3"],
          "ideal_customer": "Target customer description",
          "logo": "https://via.placeholder.com/100x100",
          "rating": 4.2,
          "approved": true,
          "id": "unique_id"
        }
        Return as a JSON array.`,
        inputs: [{
          input_object_name: 'raw_research',
          mode: 'combine_events'
        }]
      });

      if (processResult) {
        setCreatedObjects(prev => [...prev, 'structured_listings']);
      }
    } catch (error) {
      console.error('Error researching category:', error);
    }
  };

  const loadListings = async () => {
    try {
      const data = await apiCall('/return_data', 'POST', {
        object_name: 'structured_listings',
        return_type: 'json'
      });
      
      if (data.value) {
        let parsedListings = [];
        try {
          if (typeof data.value === 'string') {
            parsedListings = JSON.parse(data.value);
          } else if (Array.isArray(data.value)) {
            parsedListings = data.value.flat();
          }
          
          if (Array.isArray(parsedListings)) {
            setListings(parsedListings.map((listing, index) => ({
              ...listing,
              id: listing.id || `listing_${index}`,
              approved: listing.approved !== false
            })));
          }
        } catch (parseError) {
          console.error('Error parsing listings:', parseError);
        }
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  const loadReviews = async () => {
    const sampleReviews = [
      { listingId: 'listing_0', rating: 5, comment: 'Excellent solution, transformed our business!', user: 'Rajesh Kumar', id: 'review_1' },
      { listingId: 'listing_0', rating: 4, comment: 'Good value for money, easy to use.', user: 'Priya Sharma', id: 'review_2' },
      { listingId: 'listing_1', rating: 5, comment: 'Best investment we made for our company.', user: 'Amit Patel', id: 'review_3' }
    ];
    setReviews(sampleReviews);
  };

  const searchListings = (query) => {
    if (!query) return listings;
    return listings.filter(listing => 
      listing.name?.toLowerCase().includes(query.toLowerCase()) ||
      listing.description?.toLowerCase().includes(query.toLowerCase()) ||
      listing.problem_categories?.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const addReview = (listingId, rating, comment, user) => {
    const newReview = { listingId, rating, comment, user, id: `review_${Date.now()}` };
    setReviews([...reviews, newReview]);
  };

  const approveListings = (listingId, approved) => {
    setListings(listings.map(listing => 
      listing.id === listingId ? { ...listing, approved } : listing
    ));
  };

  const deleteAllObjects = async () => {
    for (const objectName of createdObjects) {
      try {
        await fetch(`${API_BASE}/objects/${objectName}`, {
          method: 'DELETE',
          headers
        });
      } catch (error) {
        console.error(`Error deleting ${objectName}:`, error);
      }
    }
    setCreatedObjects([]);
    setListings([]);
    setApiLogs([]);
  };

  const showRawData = async () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl max-h-96 overflow-auto">
        <h3 class="text-lg font-semibold mb-4">Raw API Data</h3>
        <pre class="text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">${JSON.stringify({
          listings: listings.slice(0, 3),
          reviews: reviews.slice(0, 3),
          apiLogs: apiLogs.slice(0, 3)
        }, null, 2)}</pre>
        <button onclick="this.parentElement.parentElement.remove()" class="mt-4 btn-primary">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
  };

  // Homepage Component
  const Homepage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSearch = (e) => {
      e.preventDefault();
      navigate(`/solutions?q=${encodeURIComponent(searchQuery)}`);
    };

    const businessVerticals = [
      { title: 'Finance & Accounting', icon: 'ð°', problems: ['Cash Flow', 'Invoicing', 'Tax Compliance'] },
      { title: 'Sales & Marketing', icon: 'ð', problems: ['Lead Generation', 'Customer Management', 'Digital Marketing'] },
      { title: 'Operations', icon: 'âï¸', problems: ['Inventory Management', 'Process Automation', 'Quality Control'] },
      { title: 'HR & People', icon: 'ð¥', problems: ['Payroll', 'Employee Management', 'Recruitment'] },
      { title: 'Technology', icon: 'ð»', problems: ['Website Development', 'Data Analytics', 'Cybersecurity'] },
      { title: 'Legal & Compliance', icon: 'âï¸', problems: ['Contract Management', 'Regulatory Compliance', 'IP Protection'] }
    ];

    const suggestions = [
      'Improve Cash Flow', 'Automate Invoicing', 'Manage Inventory', 
      'Digital Marketing', 'Customer Management', 'Payroll Processing'
    ];

    return (
      <div className="homepage">
        {/* Hero Section */}
        <section className="hero bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-24">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              Your Partner in <span className="text-primary-600 dark:text-primary-400">Business Growth</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with curated solutions, expert guidance, and proven strategies to scale your SME with confidence
            </p>
            
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
              <div className="flex bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="What business challenge can we help you solve?"
                    className="w-full px-8 py-6 text-lg bg-transparent focus:outline-none text-gray-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    aria-label="Search for business solutions"
                  />
                  
                  {showSuggestions && searchQuery.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-b-2xl shadow-lg z-10">
                      {suggestions
                        .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
                        .slice(0, 4)
                        .map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full text-left px-8 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-6 font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-800" aria-label="Search">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Solutions Showcase */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Explore Solutions by Category</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Discover curated solutions tailored to your specific business needs
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {businessVerticals.map((vertical, index) => (
                <div 
                  key={index} 
                  className="card p-8 hover:scale-105 cursor-pointer group"
                  onClick={() => navigate(`/solutions?category=${encodeURIComponent(vertical.title)}`)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Explore ${vertical.title} solutions`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/solutions?category=${encodeURIComponent(vertical.title)}`);
                    }
                  }}
                >
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-200">{vertical.icon}</div>
                  <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">{vertical.title}</h3>
                  <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                    {vertical.problems.map((problem, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                        {problem}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Story Feature */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto card overflow-hidden">
              <div className="lg:flex">
                <div className="lg:w-1/2">
                  <img 
                    src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop" 
                    alt="Mumbai Textiles success story" 
                    className="w-full h-80 lg:h-full object-cover"
                  />
                </div>
                <div className="lg:w-1/2 p-12">
                  <div className="mb-6">
                    <span className="inline-block bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-full text-sm font-medium">
                      Success Story
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Mumbai Textiles Ltd</h3>
                  <blockquote className="text-xl italic text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                    "ScaleUp Hub connected us with the perfect solution. Our business transformed in just 3 months."
                  </blockquote>
                  <div className="bg-primary-50 dark:bg-primary-900/30 p-6 rounded-2xl">
                    <p className="font-semibold text-primary-800 dark:text-primary-200 mb-2">Key Result:</p>
                    <p className="text-primary-700 dark:text-primary-300 text-lg">
                      Reduced wastage by 85% and increased profits by â¹2.5 lakhs monthly
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* New-Age Solutions Hub */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">New-Age Solutions for Modern SMEs</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Leverage cutting-edge technology to stay ahead of the competition
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-12">
              {[
                {
                  title: 'Virtual CFOs',
                  icon: 'ð',
                  items: ['Financial planning & analysis', 'Cash flow management', 'Investment advisory', 'Risk assessment']
                },
                {
                  title: 'AI for SMEs',
                  icon: 'ð¤',
                  items: ['Automated customer service', 'Predictive analytics', 'Inventory optimization', 'Sales forecasting']
                },
                {
                  title: 'No-Code Platforms',
                  icon: 'ð ï¸',
                  items: ['Custom app development', 'Workflow automation', 'Database management', 'Integration solutions']
                }
              ].map((solution, index) => (
                <div key={index} className="text-center">
                  <div className="text-6xl mb-6">{solution.icon}</div>
                  <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">{solution.title}</h3>
                  <ul className="text-gray-600 dark:text-gray-300 space-y-3">
                    {solution.items.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-center">
                        <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  };

  // Solutions Page Component
  const SolutionsPage = () => {
    const [searchParams] = new URLSearchParams(window.location.search);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const [filteredListings, setFilteredListings] = useState([]);
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('rating');

    useEffect(() => {
      let results = listings.filter(listing => listing.approved);
      
      if (query) {
        results = searchListings(query);
      }
      
      if (category) {
        results = results.filter(listing => 
          listing.problem_categories?.some(cat => 
            cat.toLowerCase().includes(category.toLowerCase())
          )
        );
      }

      if (typeFilter !== 'all') {
        results = results.filter(listing => listing.type === typeFilter);
      }

      results.sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });

      setFilteredListings(results);
    }, [listings, query, category, typeFilter, sortBy]);

    return (
      <div className="solutions-page py-12">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              {query ? `Solutions for "${query}"` : category ? `${category} Solutions` : 'All Solutions'}
            </h1>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field max-w-xs"
                aria-label="Filter by solution type"
              >
                <option value="all">All Types</option>
                <option value="software">Software</option>
                <option value="course">Courses</option>
                <option value="expert">Experts</option>
              </select>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field max-w-xs"
                aria-label="Sort solutions"
              >
                <option value="rating">Top Rated</option>
                <option value="name">A-Z</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.map((listing, index) => (
              <div key={listing.id || index} className="card p-8 hover:scale-105">
                <div className="flex items-center mb-6">
                  <img 
                    src={listing.logo || 'https://via.placeholder.com/60x60'} 
                    alt={`${listing.name} logo`} 
                    className="w-15 h-15 rounded-2xl mr-4 object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{listing.name}</h3>
                    <span className="text-sm text-primary-600 dark:text-primary-400 capitalize font-medium">
                      {listing.type}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                  {listing.description}
                </p>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-lg">â</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {listing.rating || 'N/A'}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                    {listing.pricing}
                  </span>
                </div>
                
                <Link 
                  to={`/listing/${index}`} 
                  className="block w-full text-center btn-primary"
                  aria-label={`View details for ${listing.name}`}
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-24">
              <div className="text-6xl mb-6">ð</div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">No solutions found</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Detailed Listing Page Component
  const ListingDetailPage = () => {
    const { id } = useParams();
    const listing = listings[parseInt(id)];
    const listingReviews = reviews.filter(r => r.listingId === listing?.id);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '', user: '' });

    if (!listing) {
      return (
        <div className="container mx-auto px-6 py-24 text-center">
          <div className="text-6xl mb-6">â</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Listing not found</h2>
        </div>
      );
    }

    const handleReviewSubmit = (e) => {
      e.preventDefault();
      addReview(listing.id, newReview.rating, newReview.comment, newReview.user);
      setNewReview({ rating: 5, comment: '', user: '' });
    };

    const averageRating = listingReviews.length > 0 
      ? listingReviews.reduce((sum, r) => sum + r.rating, 0) / listingReviews.length 
      : listing.rating || 0;

    return (
      <div className="listing-detail py-12">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="card p-12">
                <div className="flex items-center mb-8">
                  <img 
                    src={listing.logo || 'https://via.placeholder.com/100x100'} 
                    alt={`${listing.name} logo`} 
                    className="w-24 h-24 rounded-2xl mr-6 object-cover"
                  />
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{listing.name}</h1>
                    <p className="text-primary-600 dark:text-primary-400 capitalize text-lg font-medium mb-3">
                      {listing.type}
                    </p>
                    <div className="flex items-center">
                      <span className="text-yellow-400 text-xl">â</span>
                      <span className="ml-2 font-semibold text-lg text-gray-900 dark:text-white">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="ml-3 text-gray-500 dark:text-gray-400">
                        ({listingReviews.length} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Overview</h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {listing.detailed_overview || listing.description}
                  </p>
                </div>

                {listing.features && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Key Features</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {listing.features.map((feature, index) => (
                        <div key={index} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                          <span className="text-green-500 mr-3 text-xl">â</span>
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-12">
                  <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">User Reviews</h2>
                  
                  <form onSubmit={handleReviewSubmit} className="card p-8 mb-8">
                    <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Add Your Review</h3>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={newReview.user}
                        onChange={(e) => setNewReview({...newReview, user: e.target.value})}
                        className="input-field"
                        required
                        aria-label="Your name"
                      />
                      <select
                        value={newReview.rating}
                        onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                        className="input-field"
                        aria-label="Rating"
                      >
                        <option value={5}>5 Stars - Excellent</option>
                        <option value={4}>4 Stars - Good</option>
                        <option value={3}>3 Stars - Average</option>
                        <option value={2}>2 Stars - Poor</option>
                        <option value={1}>1 Star - Terrible</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Share your experience with this solution..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      className="input-field mb-6"
                      rows="4"
                      required
                      aria-label="Review comment"
                    />
                    <button type="submit" className="btn-primary">
                      Submit Review
                    </button>
                  </form>

                  <div className="space-y-6">
                    {listingReviews.map((review, index) => (
                      <div key={review.id || index} className="card p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-4">
                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                              {review.user.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">{review.user}</span>
                            <div className="flex mt-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                  â
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card p-8 mb-8">
                <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">At a Glance</h3>
                <div className="space-y-6">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white block mb-2">Pricing:</span>
                    <p className="text-gray-700 dark:text-gray-300 text-lg">{listing.pricing}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white block mb-2">Ideal for:</span>
                    <p className="text-gray-700 dark:text-gray-300">{listing.ideal_customer}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white block mb-2">Categories:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {listing.problem_categories?.map((cat, index) => (
                        <span key={index} className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm px-3 py-1 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="w-full btn-primary mt-8">
                  Get Started
                </button>
              </div>

              <div className="card p-8">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Success Story</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p className="mb-3 italic">
                    "This solution helped us increase efficiency by 40% in just 2 months."
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">- Similar Business Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Admin Panel Component
  const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('listings');
    const pendingListings = listings.filter(l => !l.approved);
    const approvedListings = listings.filter(l => l.approved);

    return (
      <div className="admin-panel py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-12 text-gray-900 dark:text-white">Admin Panel</h1>
          
          <div className="border-b border-gray-200 dark:border-gray-700 mb-12">
            <nav className="flex space-x-8">
              {[
                { id: 'listings', label: `Manage Listings (${pendingListings.length} pending)` },
                { id: 'reviews', label: `Manage Reviews (${reviews.length})` },
                { id: 'analytics', label: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'listings' && (
            <div>
              <h2 className="text-2xl font-semibold mb-8 text-gray-900 dark:text-white">Pending Approvals</h2>
              <div className="space-y-6 mb-12">
                {pendingListings.map((listing, index) => (
                  <div key={listing.id || index} className="card p-8">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{listing.name}</h3>
                        <p className="text-primary-600 dark:text-primary-400 capitalize mb-4">{listing.type}</p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{listing.description}</p>
                      </div>
                      <div className="flex space-x-3 ml-6">
                        <button
                          onClick={() => approveListings(listing.id, true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-green-200"
                          aria-label={`Approve ${listing.name}`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => approveListings(listing.id, false)}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-red-200"
                          aria-label={`Reject ${listing.name}`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingListings.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">â</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No pending listings</p>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-semibold mb-8 text-gray-900 dark:text-white">
                Approved Listings ({approvedListings.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedListings.slice(0, 6).map((listing, index) => (
                  <div key={listing.id || index} className="card p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{listing.name}</h3>
                    <p className="text-primary-600 dark:text-primary-400 capitalize text-sm mb-3">{listing.type}</p>
                    <div className="flex items-center">
                      <span className="text-yellow-400">â</span>
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {listing.rating || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-semibold mb-8 text-gray-900 dark:text-white">Recent Reviews</h2>
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <div key={review.id || index} className="card p-8">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-4">
                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                              {review.user.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">{review.user}</span>
                            <div className="flex mt-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                  â
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{review.comment}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Listing ID: {review.listingId}</p>
                      </div>
                      <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium ml-6">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-semibold mb-8 text-gray-900 dark:text-white">Platform Analytics</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {[
                  { title: 'Total Listings', value: listings.length, color: 'primary' },
                  { title: 'Approved', value: approvedListings.length, color: 'green' },
                  { title: 'Pending', value: pendingListings.length, color: 'yellow' },
                  { title: 'Total Reviews', value: reviews.length, color: 'purple' }
                ].map((stat, index) => (
                  <div key={index} className="card p-8 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{stat.title}</h3>
                    <p className={`text-4xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="card p-8">
                <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Listings by Type</h3>
                <div className="space-y-4">
                  {['software', 'course', 'expert'].map(type => {
                    const count = listings.filter(l => l.type === type).length;
                    const percentage = listings.length > 0 ? (count / listings.length) * 100 : 0;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize font-medium text-gray-900 dark:text-white">{type}</span>
                        <div className="flex items-center space-x-4">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div 
                              className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Header Component
  const Header = () => {
    return (
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center group">
              <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">ScaleUp Hub</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Home
              </Link>
              <Link to="/solutions" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Solutions
              </Link>
              <Link to="/upload" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Upload Data
              </Link>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? 'âï¸' : 'ð'}
              </button>
              <button 
                onClick={() => setIsAdmin(!isAdmin)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
              >
                {isAdmin ? 'Exit Admin' : 'Admin'}
              </button>
            </nav>
          </div>
        </div>
      </header>
    );
  };

  // Control Panel Component
  const ControlPanel = () => {
    return (
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        <button
          onClick={showRawData}
          className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-2xl shadow-lg font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-green-200"
          aria-label="Show raw API data"
        >
          ð Raw Data
        </button>
        <button
          onClick={deleteAllObjects}
          className="block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-2xl shadow-lg font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-red-200"
          aria-label="Delete all objects"
        >
          ðï¸ Delete All
        </button>
        <button
          onClick={initializeData}
          className="block w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-2xl shadow-lg font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-primary-200"
          disabled={loading}
          aria-label="Initialize data"
        >
          {loading ? 'â³ Loading...' : 'ð Initialize'}
        </button>
        {isAdmin && (
          <Link 
            to="/admin" 
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-2xl shadow-lg font-medium transition-colors text-center"
          >
            ð¨âð¼ Admin Panel
          </Link>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Loading ScaleUp Hub</h2>
          <p className="text-gray-600 dark:text-gray-400">Researching and populating business solutions...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Header />
        
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/upload" element={<DataUploader apiCall={apiCall} />} />
          {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
        </Routes>

        <ChatBot />
        <ControlPanel />

        {/* API Logs Display */}
        {apiLogs.length > 0 && (
          <div className="fixed bottom-6 left-6 max-w-md max-h-96 overflow-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 z-40">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">API Logs</h3>
            </div>
            <div className="p-4 space-y-2 text-xs">
              {apiLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {log.method} {log.endpoint}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default ScaleUpHub;
