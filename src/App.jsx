import { useEffect, useState } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import "./App.css";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { updateSearchCount, getTrendingMovies } from "./appwrite.js";

// --- Constants ---
// It's good practice to keep constants at the top level.
const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// --- Main App Component ---
function App() {
  // --- State Management ---
  const [searchTerm, setSearchTerm] = useState("");
  const [moviesList, setMoviesList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setLoading] = useState(true); // Start with loading true for initial fetch
  const [errorMessage, setErrorMessage] = useState("");

  // --- Debouncing ---
  // This is a more direct way to use the useDebounce hook.
  // It returns the debounced value directly, simplifying state.
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  // --- API Fetching Logic ---
  const fetchMovies = async (query) => {
    // Clear previous results and errors before a new fetch
    setLoading(true);
    setErrorMessage("");
    setMoviesList([]);

    // Check if the API key is available. This is a common setup issue.
    if (!API_KEY) {
      setErrorMessage("API Key is missing. Please check your .env file.");
      setLoading(false);
      return;
    }

    // Define API options inside the function or pass the key securely
    const API_OPTIONS = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    };

    try {
      // Determine the correct API endpoint based on whether there's a search query
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        // Provide a more specific error message if possible
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setErrorMessage(`No movies found for "${query}"`);
      } else {
        setMoviesList(data.results);
        // If it was a search, update the search count in your backend
        if (query) {
          await updateSearchCount(query, data.results[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setErrorMessage("Failed to fetch movies. Please try again later.");
    } finally {
      // This ensures the loading spinner is turned off after the fetch is complete
      setLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      // Optionally set an error message for trending movies as well
    }
  };

  // --- Effects ---
  // This single useEffect handles all movie fetching logic.
  useEffect(() => {
    if (debouncedSearchTerm) {
      // If the user is searching, fetch movies based on their query
      setTrendingMovies([]); // Clear trending movies when searching
      fetchMovies(debouncedSearchTerm);
    } else {
      // If the search bar is empty, load the default popular movies and trending list
      fetchMovies(""); // Fetch popular movies for the main list
      loadTrendingMovies();
    }
  }, [debouncedSearchTerm]); // Re-run whenever the debounced search term changes

  // --- Render Method ---
  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> you will enjoy
            without the hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {/* Show Trending Movies only when not searching */}
        {trendingMovies.length > 0 && !searchTerm && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Trending Movies</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {trendingMovies.map((movie, index) => (
                <li
                  key={movie.$id}
                  className="relative flex flex-col items-center"
                >
                  <span className="absolute text-[100px] font-bold text-white/10 z-0 leading-none">
                    {index + 1}
                  </span>
                  <img
                    src={
                      movie.poster_url ||
                      "https://placehold.co/200x300/1a1a1a/ffffff?text=No+Image"
                    }
                    alt={movie.title}
                    className="z-10 w-full rounded shadow-lg"
                  />
                  <p className="mt-2 text-sm text-white font-medium z-10 text-center">
                    {movie.title}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Main Movie List (Search Results or Popular) */}
        <section className="all-movies mt-10">
          <h2 className="text-2xl font-bold mb-6">
            {searchTerm ? `Results for "${searchTerm}"` : "Popular Movies"}
          </h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500 text-center">{errorMessage}</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {moviesList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
