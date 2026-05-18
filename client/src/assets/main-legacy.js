document.addEventListener('DOMContentLoaded', () => {
    // Initialization
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    // Loader
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 1500); // Artificial delay for aesthetic effect
    });

    // Scroll Progress & Header Logic
    const header = document.getElementById('header');
    const scrollProgress = document.getElementById('scrollProgress');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        scrollProgress.style.width = `${progress}%`;

        if (window.scrollY > 50) {
            header.classList.add('glass-dark');
            header.classList.remove('glass');
            header.style.padding = '5px 0';
        } else {
            header.classList.remove('glass-dark');
            header.classList.add('glass');
            header.style.padding = '10px 0';
        }

        if (window.scrollY > 500) {
            backToTop.style.display = 'flex';
        } else {
            backToTop.style.display = 'none';
        }
    });

    // Back to Top
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Placeholder for Cart/Wishlist logic
    let cartCount = 0;
    const cartBadge = document.querySelector('.cart-badge');
    
    // Example function to update cart
    window.updateCart = (count) => {
        cartCount += count;
        cartBadge.innerText = cartCount;
        cartBadge.classList.add('glow-anim');
        setTimeout(() => cartBadge.classList.remove('glow-anim'), 1000);
    };
});
