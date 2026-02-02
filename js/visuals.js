/**
 * Visuals.js
 * Handles dynamic rendering of atoms and molecules.
 */
export const Visuals = {
    /**
     * Renders an Atom Shell diagram into the target element using Canvas.
     * @param {HTMLElement} container - The DOM element to render into
     * @param {Object} data - { protons: number, electrons: number[] }
     */
    renderAtomShell: (container, data) => {
        container.innerHTML = ''; // Clear previous content (if any)

        const size = 200;
        const center = size / 2;

        // Canvas creation
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);

        // Nucleus
        ctx.beginPath();
        ctx.arc(center, center, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6b6b';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${data.protons}p`, center, center - 4);
        if (data.neutrons) {
            ctx.fillText(`${data.neutrons}n`, center, center + 6);
        }

        // Shells
        const shells = [40, 65, 90, 115]; // K, L, M, N radii
        // data.electrons is array of counts per shell, e.g. [2, 8, 1]

        data.electrons.forEach((num, index) => {
            const r = shells[index] || (90 + index * 20); // Fallback radius

            // Draw Orbit
            ctx.beginPath();
            ctx.arc(center, center, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw Electrons
            for (let i = 0; i < num; i++) {
                const angle = (Math.PI * 2 / num) * i - (Math.PI / 2); // Start top
                const x = center + Math.cos(angle) * r;
                const y = center + Math.sin(angle) * r;

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#4ecdc4'; // Electron color
                ctx.fill();
            }
        });
    }
};
