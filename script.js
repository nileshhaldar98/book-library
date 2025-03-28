// Global state variables
let currentPage = 1;
const booksPerPage = 12;
let isLoading = false;
let currentSearchQuery = '';
let currentSortOption = 'title';

// Fetch books from the Google Books API with pagination
async function fetchBooks(page = 1) {
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=subject:fiction&startIndex=${(page - 1) * booksPerPage}&maxResults=${booksPerPage}`);
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching books:', error);
        throw error;
    }
}

// Generate HTML template for a single book card
function createBookCard(book) {
    const volumeInfo = book.volumeInfo;
    const thumbnail = volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
    return `
        <div class="book-card">
            <img src="${thumbnail}" alt="${volumeInfo.title}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${volumeInfo.title}</h3>
                <p class="book-author">${volumeInfo.authors?.join(', ') || 'Unknown Author'}</p>
            </div>
        </div>
    `;
}

// Filter books based on search query (title or author)
function filterBooks(books, query) {
    if (!query) return books;
    query = query.toLowerCase();
    return books.filter(book => 
        book.volumeInfo.title.toLowerCase().includes(query) ||
        (book.volumeInfo.authors?.join(' ').toLowerCase().includes(query))
    );
}

// Sort books by title, author, or publication date
function sortBooks(books) {
    return books.sort((a, b) => {
        const aInfo = a.volumeInfo;
        const bInfo = b.volumeInfo;
        
        switch (currentSortOption) {
            case 'title':
                return aInfo.title.localeCompare(bInfo.title);
            case 'author':
                const aAuthor = aInfo.authors?.[0] || '';
                const bAuthor = bInfo.authors?.[0] || '';
                return aAuthor.localeCompare(bAuthor);
            case 'date':
                return new Date(bInfo.publishedDate || 0) - new Date(aInfo.publishedDate || 0);
            default:
                return 0;
        }
    });
}

// Main function to load and display books with filtering and sorting
async function loadBooks(isNewSearch = false) {
    if (isLoading) return;
    
    try {
        isLoading = true;
        document.getElementById('loading').classList.remove('hidden');
        
        // Reset grid for new searches
        if (isNewSearch) {
            currentPage = 1;
            document.querySelector('.books-grid').innerHTML = '';
        }
        
        // Fetch, filter, sort and display books
        const books = await fetchBooks(currentPage);
        const filteredBooks = filterBooks(books, currentSearchQuery);
        const sortedBooks = sortBooks(filteredBooks);
        
        const booksHTML = sortedBooks.map(book => createBookCard(book)).join('');
        document.querySelector('.books-grid').insertAdjacentHTML('beforeend', booksHTML);
        
        currentPage++;
    } catch (error) {
        console.error('Error loading books:', error);
    } finally {
        isLoading = false;
        document.getElementById('loading').classList.add('hidden');
    }
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Load initial set of books
    loadBooks();
    
    // Debounced search functionality
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearchQuery = e.target.value;
            loadBooks(true);
        }, 300);
    });
    
    // Sort functionality
    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentSortOption = e.target.value;
        loadBooks(true);
    });
    
    // Create and append load more button
    const loadMoreButton = document.createElement('button');
    loadMoreButton.id = 'load-more-btn';
    loadMoreButton.className = 'load-more-btn';
    loadMoreButton.textContent = 'Load More Books';
    document.querySelector('.main-content').appendChild(loadMoreButton);
    
    // Load more functionality
    loadMoreButton.addEventListener('click', () => {
        loadBooks();
    });
});