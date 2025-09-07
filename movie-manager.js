// Movie Manager - Управление фильмами и сериалами
class MovieManager {
    constructor() {
        this.movies = [];
        this.series = [];
        this.currentFilter = 'all';
        this.currentSort = 'rating';
        this.currentView = 'grid';
        this.currentPage = 1;
        this.moviesPerPage = 8;
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        this.init();
    }

    init() {
        this.loadMovies();
        this.setupEventListeners();
        this.renderMovies();
    }

    // Загрузка данных фильмов
    loadMovies() {
        // Загружаем из основного файла или API
        if (typeof moviesData !== 'undefined') {
            this.movies = [...moviesData];
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Фильтрация
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });

        // Сортировка
        document.getElementById('sortBtn')?.addEventListener('click', () => this.handleSort());
        
        // Поиск
        document.getElementById('searchInput')?.addEventListener('input', 
            this.debounce((e) => this.handleSearch(e.target.value), 300)
        );

        // Переключение вида
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleViewChange(e.target.dataset.view));
        });

        // Загрузка еще
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => this.handleLoadMore());
    }

    // Добавление фильма
    addMovie(movieData) {
        const newMovie = {
            id: this.generateId(),
            ...movieData,
            downloadCount: 0,
            isAvailable: true,
            type: 'movie'
        };
        
        this.movies.push(newMovie);
        this.renderMovies();
        this.showNotification(`Фильм "${newMovie.title}" добавлен!`, 'success');
        return newMovie;
    }

    // Добавление сериала
    addSeries(seriesData) {
        const newSeries = {
            id: this.generateId(),
            ...seriesData,
            downloadCount: 0,
            isAvailable: true,
            type: 'series',
            seasons: seriesData.seasons || 1,
            episodes: seriesData.episodes || []
        };
        
        this.series.push(newSeries);
        this.renderSeries();
        this.showNotification(`Сериал "${newSeries.title}" добавлен!`, 'success');
        return newSeries;
    }

    // Обновление фильма/сериала
    updateItem(id, updates) {
        const movieIndex = this.movies.findIndex(m => m.id === id);
        const seriesIndex = this.series.findIndex(s => s.id === id);
        
        if (movieIndex > -1) {
            this.movies[movieIndex] = { ...this.movies[movieIndex], ...updates };
            this.renderMovies();
            this.showNotification(`Фильм "${this.movies[movieIndex].title}" обновлен!`, 'success');
        } else if (seriesIndex > -1) {
            this.series[seriesIndex] = { ...this.series[seriesIndex], ...updates };
            this.renderSeries();
            this.showNotification(`Сериал "${this.series[seriesIndex].title}" обновлен!`, 'success');
        }
    }

    // Удаление фильма/сериала
    removeItem(id) {
        const movieIndex = this.movies.findIndex(m => m.id === id);
        const seriesIndex = this.series.findIndex(s => s.id === id);
        
        if (movieIndex > -1) {
            const movie = this.movies[movieIndex];
            this.movies.splice(movieIndex, 1);
            this.renderMovies();
            this.showNotification(`Фильм "${movie.title}" удален!`, 'info');
        } else if (seriesIndex > -1) {
            const series = this.series[seriesIndex];
            this.series.splice(seriesIndex, 1);
            this.renderSeries();
            this.showNotification(`Сериал "${series.title}" удален!`, 'info');
        }
    }

    // Поиск
    handleSearch(query) {
        const searchQuery = query.toLowerCase().trim();
        
        if (searchQuery === '') {
            this.renderMovies();
            return;
        }

        const filteredMovies = this.movies.filter(movie => 
            movie.title.toLowerCase().includes(searchQuery) ||
            movie.genre.some(g => g.toLowerCase().includes(searchQuery)) ||
            movie.description.toLowerCase().includes(searchQuery) ||
            movie.year.toString().includes(searchQuery)
        );

        this.renderFilteredMovies(filteredMovies);
    }

    // Фильтрация
    handleFilter(filter) {
        this.currentFilter = filter;
        
        // Обновляем активную вкладку
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.filter === filter) {
                tab.classList.add('active');
            }
        });

        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.movies];
        
        // Фильтр по жанру
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(movie => 
                movie.genre.some(g => g.toLowerCase().includes(this.currentFilter))
            );
        }

        // Фильтр по году
        const yearFilter = document.getElementById('yearFilter')?.value;
        if (yearFilter) {
            filtered = filtered.filter(movie => movie.year.toString() === yearFilter);
        }

        // Фильтр по рейтингу
        const ratingFilter = document.getElementById('ratingFilter')?.value;
        if (ratingFilter) {
            filtered = filtered.filter(movie => movie.rating >= parseFloat(ratingFilter));
        }

        this.renderFilteredMovies(filtered);
    }

    // Сортировка
    handleSort() {
        const sortOptions = ['rating', 'year', 'title', 'downloadCount'];
        const currentIndex = sortOptions.indexOf(this.currentSort);
        const nextIndex = (currentIndex + 1) % sortOptions.length;
        this.currentSort = sortOptions[nextIndex];
        
        const sortBtn = document.getElementById('sortBtn');
        if (sortBtn) {
            sortBtn.innerHTML = `<i class="fas fa-sort"></i> ${this.getSortLabel(this.currentSort)}`;
        }
        
        this.sortMovies();
    }

    getSortLabel(sort) {
        const labels = {
            'rating': 'По рейтингу',
            'year': 'По году',
            'title': 'По названию',
            'downloadCount': 'По популярности'
        };
        return labels[sort];
    }

    sortMovies() {
        this.movies.sort((a, b) => {
            switch (this.currentSort) {
                case 'rating':
                    return b.rating - a.rating;
                case 'year':
                    return b.year - a.year;
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'downloadCount':
                    return b.downloadCount - a.downloadCount;
                default:
                    return 0;
            }
        });
        
        this.renderMovies();
    }

    // Переключение вида
    handleViewChange(view) {
        this.currentView = view;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });
        
        this.renderMovies();
    }

    // Загрузка еще
    handleLoadMore() {
        this.currentPage++;
        this.renderMovies();
    }

    // Рендеринг фильмов
    renderMovies() {
        const startIndex = 0;
        const endIndex = this.currentPage * this.moviesPerPage;
        const moviesToShow = this.movies.slice(startIndex, endIndex);
        
        this.renderMovieCards(moviesToShow);
    }

    renderFilteredMovies(movies) {
        this.renderMovieCards(movies);
    }

    renderMovieCards(movies) {
        const moviesGrid = document.getElementById('moviesGrid');
        if (!moviesGrid) return;

        if (movies.length === 0) {
            moviesGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Фильмы не найдены</h3>
                    <p>Попробуйте изменить параметры поиска</p>
                </div>
            `;
            return;
        }

        moviesGrid.innerHTML = movies.map(movie => this.createMovieCard(movie)).join('');
        this.attachMovieCardListeners();
    }

    createMovieCard(movie) {
        const isFavorite = this.favorites.includes(movie.id);
        const downloadStatus = movie.isAvailable ? 'available' : 'unavailable';
        
        return `
            <div class="movie-card ${this.currentView === 'list' ? 'list-view' : ''}" data-movie-id="${movie.id}">
                <div class="movie-poster">
                    <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
                    <div class="movie-overlay">
                        <button class="play-btn" onclick="movieManager.openModal(${movie.id})">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                    <div class="movie-quality-badge">
                        <span class="quality-tag">${movie.quality}</span>
                    </div>
                </div>
                <div class="download-stats">
                    <span class="download-count">
                        <i class="fas fa-download"></i>
                        ${this.formatNumber(movie.downloadCount)}
                    </span>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span class="movie-year">${movie.year}</span>
                        <div class="movie-rating">
                            <i class="fas fa-star"></i>
                            <span>${movie.rating}</span>
                        </div>
                    </div>
                    <div class="movie-file-info">
                        <span class="file-size">${movie.fileSize}</span>
                        <span class="file-format">${movie.format}</span>
                    </div>
                    <div class="movie-genres">
                        ${movie.genre.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                    </div>
                    <div class="movie-actions">
                        <button class="btn btn-download ${downloadStatus}" onclick="movieManager.downloadMovie(${movie.id}, event)" ${!movie.isAvailable ? 'disabled' : ''}>
                            <i class="fas fa-download"></i>
                            ${movie.isAvailable ? 'Скачать' : 'Недоступно'}
                        </button>
                        <button class="btn btn-secondary ${isFavorite ? 'favorited' : ''}" onclick="movieManager.toggleFavorite(${movie.id}, event)">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="btn btn-info" onclick="movieManager.openModal(${movie.id})">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Прикрепление обработчиков к карточкам
    attachMovieCardListeners() {
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const movieId = parseInt(card.dataset.movieId);
                    this.openModal(movieId);
                }
            });
        });
    }

    // Открытие модального окна
    openModal(movieId) {
        const movie = this.movies.find(m => m.id === movieId);
        if (!movie) return;

        const modal = document.getElementById('movieModal');
        if (!modal) return;

        // Заполняем данные
        document.getElementById('modalPoster').src = movie.poster;
        document.getElementById('modalTitle').textContent = movie.title;
        document.getElementById('modalYear').textContent = movie.year;
        document.getElementById('modalDuration').textContent = movie.duration;
        document.getElementById('modalRatingValue').textContent = movie.rating;
        document.getElementById('modalGenre').textContent = movie.genre.join(', ');
        document.getElementById('modalDescription').textContent = movie.description;
        document.getElementById('modalQuality').textContent = movie.quality;
        document.getElementById('modalFileSize').textContent = `Размер: ${movie.fileSize}`;
        document.getElementById('modalQualityInfo').textContent = `Качество: ${movie.quality}`;
        document.getElementById('modalFormat').textContent = `Формат: ${movie.format}`;
        document.getElementById('modalDownloadCount').textContent = `Скачиваний: ${this.formatNumber(movie.downloadCount)}`;

        // Показываем модальное окно
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';

        // Обработчики кнопок
        document.getElementById('modalDownloadBtn').onclick = () => this.downloadMovie(movieId);
        document.getElementById('addToFavorites').onclick = () => this.toggleFavorite(movieId);
        document.getElementById('modalShareBtn').onclick = () => this.shareMovie(movie);
    }

    // Закрытие модального окна
    closeModal() {
        const modal = document.getElementById('movieModal');
        if (!modal) return;

        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }

    // Скачивание фильма
    downloadMovie(movieId, event) {
        if (event) event.stopPropagation();
        
        const movie = this.movies.find(m => m.id === movieId);
        if (!movie || !movie.isAvailable) {
            this.showNotification('Фильм недоступен для скачивания', 'error');
            return;
        }
        
        this.showDownloadProgress(movie);
        
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = movie.downloadFile;
            link.download = `${movie.title} (${movie.year}).${movie.format.toLowerCase()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            movie.downloadCount++;
            this.showNotification(`Скачивание ${movie.title} началось!`, 'success');
        }, 1000);
    }

    // Показать прогресс скачивания
    showDownloadProgress(movie) {
        const progressModal = document.createElement('div');
        progressModal.className = 'download-progress-modal';
        progressModal.innerHTML = `
            <div class="progress-content">
                <div class="progress-icon">
                    <i class="fas fa-download"></i>
                </div>
                <h3>Подготовка к скачиванию</h3>
                <p>${movie.title}</p>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-info">
                    <span>Размер: ${movie.fileSize}</span>
                    <span>Качество: ${movie.quality}</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(progressModal);
        
        setTimeout(() => {
            const progressFill = progressModal.querySelector('.progress-fill');
            progressFill.style.width = '100%';
        }, 100);
        
        setTimeout(() => {
            document.body.removeChild(progressModal);
        }, 2000);
    }

    // Переключение избранного
    toggleFavorite(movieId, event) {
        if (event) event.stopPropagation();
        
        const index = this.favorites.indexOf(movieId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(movieId);
        }
        
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.updateFavoritesCount();
        
        const button = event?.target.closest('.btn-secondary');
        if (button) {
            if (this.favorites.includes(movieId)) {
                button.classList.add('favorited');
            } else {
                button.classList.remove('favorited');
            }
        }
    }

    // Поделиться фильмом
    shareMovie(movie) {
        if (navigator.share) {
            navigator.share({
                title: movie.title,
                text: movie.description,
                url: window.location.href
            });
        } else {
            // Fallback для браузеров без поддержки Web Share API
            const shareText = `Посмотрите "${movie.title}" (${movie.year}) - ${movie.description}`;
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Ссылка скопирована в буфер обмена!', 'success');
            });
        }
    }

    // Обновление счетчика избранного
    updateFavoritesCount() {
        const favoritesCount = document.querySelector('.favorites-count');
        if (favoritesCount) {
            favoritesCount.textContent = this.favorites.length;
        }
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Утилиты
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Публичные методы для глобального доступа
    getMovies() {
        return this.movies;
    }

    getSeries() {
        return this.series;
    }

    getFavorites() {
        return this.favorites;
    }
}

// Создаем глобальный экземпляр
window.movieManager = new MovieManager();

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MovieManager;
}
