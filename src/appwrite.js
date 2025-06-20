import { Client, Databases, ID, Query, Permission, Role } from "appwrite";

// Load values from .env
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// Setup client
const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1") // Appwrite endpoint
  .setProject(PROJECT_ID);                         // Your project ID

const database = new Databases(client);

// 🔄 Update or create search count entry
export const updateSearchCount = async (searchTerm, movie) => {
  try {
    // Search for existing document by searchTerm
    const result = await database.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal("searchTerm", searchTerm)]
    );

    if (result.documents.length > 0) {
      const doc = result.documents[0];
      const currentCount = typeof doc.count === 'number' ? doc.count : 0;

      // ✅ Update count if document exists
      await database.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        doc.$id,
        { count: currentCount + 1 }
      );

    } else {
      // ✅ Create new document if not found
      await database.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          searchTerm,
          count: 1,
          movie_id: movie.id,
          poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          title: movie.title
        },
        [
          Permission.read(Role.any()),   // Allow read access
          Permission.write(Role.any())   // Allow write access
        ]
      );
    }
  } catch (error) {
    console.error("❌ Error updating search count:", error.message, error.response);
  }
};

// 🔝 Get top trending movies by count
export const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.limit(5), // Limit to top 10
        Query.orderDesc("count"),
        
      ]
    );
    return result.documents;
  } catch (error) {
    console.error("error")
  }
};

/*export const updateSearchCount = async ()=> {
  console.log(PROJECT_ID, DATABASE_ID, COLLECTION_ID);
}*/