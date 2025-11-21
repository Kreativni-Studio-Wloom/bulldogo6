// Force Ad Actions Position - JavaScript override
document.addEventListener('DOMContentLoaded', function() {
    console.log('Force Ad Actions Position script loaded');
    
    // Najdi všechny ad-actions elementy
    const adActions = document.querySelectorAll('.ad-actions');
    console.log('Found ad-actions elements:', adActions.length);
    
    adActions.forEach((element, index) => {
        console.log(`Processing ad-actions ${index}:`, element);
        
        // Přidej inline styly pro pozicování v textovém toku
        element.style.position = 'static';
        element.style.top = 'auto';
        element.style.bottom = 'auto';
        element.style.right = 'auto';
        element.style.left = 'auto';
        element.style.marginTop = '2px';
        element.style.padding = '2px 0';
        element.style.marginBottom = '8px';
        element.style.paddingBottom = '8px';
        element.style.display = 'flex';
        element.style.flexDirection = 'row';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.gap = '12px';
        element.style.zIndex = '999';
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
        
        // Přidej debug třídu
        element.classList.add('js-positioned');
        
        console.log(`Applied positioning to ad-actions ${index}`);
    });
    
    // Sleduj nové elementy (pro dynamicky načítané inzeráty)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    const newAdActions = node.querySelectorAll ? node.querySelectorAll('.ad-actions') : [];
                    newAdActions.forEach((element) => {
                        console.log('Found new ad-actions element:', element);
                        element.style.position = 'static';
                        element.style.top = 'auto';
                        element.style.bottom = 'auto';
                        element.style.right = 'auto';
                        element.style.left = 'auto';
                        element.style.marginTop = '2px';
                        element.style.padding = '2px 0';
                        element.style.marginBottom = '8px';
                        element.style.paddingBottom = '8px';
                        element.style.display = 'flex';
                        element.style.flexDirection = 'row';
                        element.style.alignItems = 'center';
                        element.style.justifyContent = 'center';
                        element.style.gap = '12px';
                        element.style.zIndex = '999';
                        element.style.opacity = '1';
                        element.style.transform = 'translateX(0)';
                        element.classList.add('js-positioned');
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('MutationObserver started');
});
