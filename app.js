// Pokemon Explorer JavaScript

class PokemonExplorer {
    constructor() {
        this.apiBase = 'https://pokeapi.co/api/v2/pokemon/';
        this.initializeElements();
        this.bindEvents();
        this.hideAllSections();
    }

    initializeElements() {
        // Form elements
        this.searchForm = document.getElementById('searchForm');
        this.pokemonInput = document.getElementById('pokemonInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.randomBtn = document.getElementById('randomBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.closeHelp = document.getElementById('closeHelp');

        // Display sections
        this.resultsSection = document.getElementById('resultsSection');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.pokemonCard = document.getElementById('pokemonCard');
        this.helpSection = document.getElementById('helpSection');

        // Pokemon display elements
        this.pokemonImage = document.getElementById('pokemonImage');
        this.pokemonName = document.getElementById('pokemonName');
        this.pokemonId = document.getElementById('pokemonId');
        this.pokemonHeight = document.getElementById('pokemonHeight');
        this.pokemonWeight = document.getElementById('pokemonWeight');
        this.pokemonExp = document.getElementById('pokemonExp');
        this.pokemonTypes = document.getElementById('pokemonTypes');
        this.abilitiesList = document.getElementById('abilitiesList');
        this.errorText = document.getElementById('errorText');
    }

    bindEvents() {
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchPokemon();
        });

        this.randomBtn.addEventListener('click', () => {
            this.getRandomPokemon();
        });

        this.helpBtn.addEventListener('click', () => {
            this.showHelp();
        });

        this.closeHelp.addEventListener('click', () => {
            this.hideHelp();
        });

        // Close help when clicking outside
        this.helpSection.addEventListener('click', (e) => {
            if (e.target === this.helpSection) {
                this.hideHelp();
            }
        });

        // Enter key support for input
        this.pokemonInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchPokemon();
            }
        });
    }

    hideAllSections() {
        this.loading.classList.remove('show');
        this.errorMessage.classList.remove('show');
        this.pokemonCard.classList.remove('show');
        this.helpSection.classList.remove('show');
    }

    showLoading() {
        this.hideAllSections();
        this.loading.classList.add('show');
        this.searchBtn.disabled = true;
        this.searchBtn.textContent = 'Searching...';
    }

    hideLoading() {
        this.loading.classList.remove('show');
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = 'Search Pokemon';
    }

    showError(message = 'Pokemon not found! Please check the spelling or try a different Pokemon name/ID.') {
        this.hideAllSections();
        this.errorText.textContent = message;
        this.errorMessage.classList.add('show');
    }

    showPokemon(pokemon) {
        this.hideAllSections();
        this.populatePokemonData(pokemon);
        this.pokemonCard.classList.add('show');
    }

    showHelp() {
        this.helpSection.classList.add('show');
    }

    hideHelp() {
        this.helpSection.classList.remove('show');
    }

    async searchPokemon() {
        const query = this.pokemonInput.value.trim().toLowerCase();
        
        if (!query) {
            this.showError('Please enter a Pokemon name or ID number.');
            return;
        }

        this.showLoading();

        try {
            const pokemon = await this.fetchPokemon(query);
            this.showPokemon(pokemon);
            
            // Store the last successful search
            this.pokemonInput.value = '';
        } catch (error) {
            console.error('Error fetching Pokemon:', error);
            
            if (error.message.includes('404')) {
                this.showError(`Pokemon "${query}" not found. Please check the spelling or try a different name/ID.`);
            } else if (error.message.includes('network')) {
                this.showError('Network error. Please check your internet connection and try again.');
            } else {
                this.showError('An error occurred while fetching Pokemon data. Please try again.');
            }
        } finally {
            this.hideLoading();
        }
    }

    async getRandomPokemon() {
        // Generate random Pokemon ID (1-1010 covers most Pokemon)
        const randomId = Math.floor(Math.random() * 1010) + 1;
        
        this.showLoading();

        try {
            const pokemon = await this.fetchPokemon(randomId.toString());
            this.showPokemon(pokemon);
        } catch (error) {
            console.error('Error fetching random Pokemon:', error);
            this.showError('Unable to fetch random Pokemon. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async fetchPokemon(query) {
        const response = await fetch(`${this.apiBase}${query}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('404: Pokemon not found');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        return await response.json();
    }

    populatePokemonData(pokemon) {
        // Basic info
        this.pokemonName.textContent = this.capitalize(pokemon.name);
        this.pokemonId.textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
        
        // Image handling with better error management
        this.loadPokemonImage(pokemon);

        // Stats
        this.pokemonHeight.textContent = `${(pokemon.height / 10).toFixed(1)} m`;
        this.pokemonWeight.textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;
        this.pokemonExp.textContent = pokemon.base_experience || 'N/A';

        // Types
        this.populateTypes(pokemon.types);

        // Abilities
        this.populateAbilities(pokemon.abilities);
    }

    loadPokemonImage(pokemon) {
        // Try multiple image sources in order of preference
        const imageSources = [
            pokemon.sprites?.other?.['official-artwork']?.front_default,
            pokemon.sprites?.other?.dream_world?.front_default,
            pokemon.sprites?.front_default,
            pokemon.sprites?.front_shiny,
            // Fallback to raw GitHub sprites if others fail
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
        ].filter(Boolean); // Remove null/undefined values

        // Reset image
        this.pokemonImage.style.display = 'none';
        this.pokemonImage.src = '';
        
        if (imageSources.length === 0) {
            this.handleImageError(pokemon);
            return;
        }

        this.tryLoadImage(imageSources, 0, pokemon);
    }

    tryLoadImage(sources, index, pokemon) {
        if (index >= sources.length) {
            this.handleImageError(pokemon);
            return;
        }

        const img = new Image();
        
        img.onload = () => {
            this.pokemonImage.src = sources[index];
            this.pokemonImage.alt = `${pokemon.name} sprite`;
            this.pokemonImage.style.display = 'block';
        };

        img.onerror = () => {
            console.log(`Failed to load image from source ${index + 1}:`, sources[index]);
            this.tryLoadImage(sources, index + 1, pokemon);
        };

        // Start loading the image
        img.src = sources[index];
    }

    handleImageError(pokemon) {
        // Show a placeholder or text when no image is available
        this.pokemonImage.style.display = 'none';
        console.log(`No image available for ${pokemon.name} (ID: ${pokemon.id})`);
        
        // Could add a placeholder image here if desired
        // this.pokemonImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23f0f0f0"/><text x="60" y="60" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="12" fill="%23666">No Image</text></svg>';
        // this.pokemonImage.alt = 'No image available';
        // this.pokemonImage.style.display = 'block';
    }

    populateTypes(types) {
        this.pokemonTypes.innerHTML = '';
        
        types.forEach(typeInfo => {
            const typeBadge = document.createElement('span');
            typeBadge.className = `type-badge type-badge--${typeInfo.type.name}`;
            typeBadge.textContent = this.capitalize(typeInfo.type.name);
            this.pokemonTypes.appendChild(typeBadge);
        });
    }

    populateAbilities(abilities) {
        this.abilitiesList.innerHTML = '';
        
        abilities.forEach(abilityInfo => {
            const abilityTag = document.createElement('span');
            abilityTag.className = 'ability-tag';
            abilityTag.textContent = this.formatAbilityName(abilityInfo.ability.name);
            this.abilitiesList.appendChild(abilityTag);
        });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatAbilityName(name) {
        // Replace hyphens with spaces and capitalize each word
        return name.split('-').map(word => this.capitalize(word)).join(' ');
    }

    // Auto-suggest functionality (basic implementation)
    initializeAutoSuggest() {
        const commonPokemon = [
            'pikachu', 'charizard', 'blastoise', 'venusaur', 'alakazam',
            'machamp', 'golem', 'gengar', 'gyarados', 'lapras',
            'eevee', 'snorlax', 'articuno', 'zapdos', 'moltres',
            'dragonite', 'mewtwo', 'mew', 'lucario', 'garchomp'
        ];

        this.pokemonInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            if (value.length >= 2) {
                const suggestions = commonPokemon.filter(name => 
                    name.startsWith(value)
                );
                // Could implement dropdown here
            }
        });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PokemonExplorer();
    
    // Optional: Load a default Pokemon on startup
    // Uncomment the next line to show Pikachu by default
    // setTimeout(() => app.fetchPokemon('pikachu').then(pokemon => app.showPokemon(pokemon)), 100);
});

// Add some helpful console messages for developers
console.log('🔥 Pokemon Explorer loaded!');
console.log('💡 Tip: This app uses the PokeAPI (pokeapi.co) to fetch Pokemon data');
console.log('🚀 Ready to deploy to any static hosting service!');

// Service Worker registration for offline capability (optional enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered: ', registration))
        //     .catch(registrationError => console.log('SW registration failed: ', registrationError));
    });
}

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('✅ Back online! Pokemon data fetching restored.');
});

window.addEventListener('offline', () => {
    console.log('❌ Offline mode. Pokemon searches may not work.');
});

// Keyboard shortcuts for power users
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('pokemonInput').focus();
    }
    
    // Ctrl/Cmd + R for random Pokemon
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        document.getElementById('randomBtn').click();
    }
    
    // Escape to close help
    if (e.key === 'Escape') {
        const helpSection = document.getElementById('helpSection');
        if (helpSection.classList.contains('show')) {
            document.getElementById('closeHelp').click();
        }
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PokemonExplorer;
}