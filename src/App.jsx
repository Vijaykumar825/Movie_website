import { useEffect, useState } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import "./App.css";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { updateSearchCount, getTrendingMovies } from "./appwrite.js"; // Import the function to update search count

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
//onsole.log("API_KEY:", API_KEY); // Debugging line to check if API_KEY is loaded correctly

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [moviesList, setMoviesList] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState();
  const [trendingMovies, setTrendingMovies] = useState([]);
  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm);
    },
    500, // 500ms debounce time
    [searchTerm]
  );

  const fetchMovies = async (query = "") => {
    setLoading(true);
    setErrorMessage(""); // Reset error message
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        setErrorMessage("No movies found");
        setMoviesList([]);
      } else {
        setMoviesList(data.results);
      }
      if (query && data.results.length > 0) {
        // If a search term is provided and movies are found, update the search count
        await updateSearchCount(query, data.results[0]); // Update with the first movie found
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setErrorMessage("Failed to fetch movies. Please try again later.");
    } finally {
      setLoading(false); // ✅ Important: turn off loading state
    }
  };
  const loadtrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    }
  };
  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      loadtrendingMovies();
    } else {
      setTrendingMovies([]); // Clear trending list if searching
    }
  }, [searchTerm]);

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
        {trendingMovies.length > 0 && (
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
                      "https://via.placeholder.com/100x150?text=No+Image"
                    }
                    alt={movie.title}
                    className="z-10 w-full rounded shadow-lg"
                  />
                  <p className="mt-2 text-sm text-white font-medium z-10">
                    {index + 1}
                    <span>.</span>
                    {movie.title}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2 className="mt-[40px]">All Movies</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
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
