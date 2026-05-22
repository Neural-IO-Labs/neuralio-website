/**
 * Neural:IO Labs - Website Sandbox & Telemetry Simulator
 * ========================================================
 * High-fidelity client-side training pipeline simulator.
 * Calculates exact monetary and hardware ROI, drives animated SVG graphs,
 * and outputs realistic sharding/caching status logs.
 */

(function () {
    // --- Hardware & Cloud Constants ---
    const HARDWARE_SPECS = {
        'rtx-5080': { name: 'NVIDIA RTX 5080 (16GB)', rate: 1.20, baseSpeed: 0.35, nioSpeed: 16.2 },
        'rtx-5090': { name: 'NVIDIA RTX 5090 (32GB)', rate: 1.90, baseSpeed: 0.45, nioSpeed: 20.4 },
        'rtx-4090': { name: 'NVIDIA RTX 4090 (24GB)', rate: 0.90, baseSpeed: 0.25, nioSpeed: 8.5 },
        'rtx-3090': { name: 'NVIDIA RTX 3090 (24GB)', rate: 0.40, baseSpeed: 0.18, nioSpeed: 6.2 },
        'b200': { name: 'NVIDIA B200 (192GB SXM)', rate: 4.50, baseSpeed: 0.60, nioSpeed: 48.2 },
        'h200': { name: 'NVIDIA H200 (141GB SXM)', rate: 3.50, baseSpeed: 0.52, nioSpeed: 34.2 },
        'h100': { name: 'NVIDIA H100 (80GB SXM5)', rate: 2.50, baseSpeed: 0.45, nioSpeed: 24.5 },
        'a100-80gb': { name: 'NVIDIA A100 (80GB SXM)', rate: 2.20, baseSpeed: 0.38, nioSpeed: 14.8 },
        'a100-40gb': { name: 'NVIDIA A100 (40GB PCIe)', rate: 1.50, baseSpeed: 0.30, nioSpeed: 10.5 },
        'l40s': { name: 'NVIDIA L40S (48GB Ada)', rate: 1.25, baseSpeed: 0.30, nioSpeed: 12.5 },
        'l4': { name: 'NVIDIA L4 (24GB Ada)', rate: 0.50, baseSpeed: 0.20, nioSpeed: 7.2 },
        'a10g': { name: 'NVIDIA A10G (24GB PCIe)', rate: 1.00, baseSpeed: 0.15, nioSpeed: 5.4 },
        't4': { name: 'NVIDIA T4 (16GB PCIe)', rate: 0.25, baseSpeed: 0.08, nioSpeed: 2.1 },
        'mi325x': { name: 'AMD MI325X (256GB OAM)', rate: 3.00, baseSpeed: 0.48, nioSpeed: 38.4 },
        'mi300x': { name: 'AMD MI300X (192GB OAM)', rate: 2.20, baseSpeed: 0.40, nioSpeed: 28.6 }
    };

    const CLOUD_SPECS = {
        'aws': { name: 'Amazon S3', egressRate: 0.09, storageRate: 0.023 },
        'gcp': { name: 'Google Cloud Storage', egressRate: 0.12, storageRate: 0.020 },
        'azure': { name: 'Azure Blob Storage', egressRate: 0.087, storageRate: 0.021 },
        'r2': { name: 'Cloudflare R2', egressRate: 0.00, storageRate: 0.015 },
        'own': { name: 'Local / On-Prem Storage', egressRate: 0.00, storageRate: 0.00 }
    };

    // --- State Variables ---
    let activeInterval = null;
    let currentStep = 1;
    let isRunning = false;
    
    // Accumulators
    let totalLogicalGB = 0;
    let totalActualGB = 0;
    let totalEgressSavedGB = 0;
    let totalComputeSecondsSaved = 0;
    let totalROIdollars = 0;
    let totalSimulatedHours = 0;

    const SIMULATED_HOURS_PER_STEP = 4.0; // Each 3s tick represents 4 hours of training time

    // --- DOM Elements ---
    let gpuSelect, modelSelect, customSizeSlider, sliderVal, clusterSelect, cloudSelect;
    let btnLaunch, btnReset;
    
    // Metrics
    let mThroughput, mDedupe, mVram, mEgress, mNvme, mCompute, mRoi, mSimTime;
    let topologySvg, terminalLog, standardBar, nioBar;

    document.addEventListener('DOMContentLoaded', function () {
        initElements();
        initEvents();
    });

    function initElements() {
        gpuSelect = document.getElementById('sbGpu');
        modelSelect = document.getElementById('sbModel');
        customSizeSlider = document.getElementById('sbCustomSize');
        sliderVal = document.getElementById('sbSliderVal');
        clusterSelect = document.getElementById('sbCluster');
        cloudSelect = document.getElementById('sbCloud');
        btnLaunch = document.getElementById('sbBtnLaunch');
        btnReset = document.getElementById('sbBtnReset');

        mThroughput = document.getElementById('mThroughput');
        mDedupe = document.getElementById('mDedupe');
        mVram = document.getElementById('mVram');
        mEgress = document.getElementById('mEgress');
        mNvme = document.getElementById('mNvme');
        mCompute = document.getElementById('mCompute');
        mRoi = document.getElementById('mRoi');
        mSimTime = document.getElementById('mSimTime');

        topologySvg = document.getElementById('sbTopologySvg');
        terminalLog = document.getElementById('sbTerminalLog');
        standardBar = document.getElementById('sbStandardBar');
        nioBar = document.getElementById('sbNioBar');
    }

    function initEvents() {
        if (!gpuSelect) return;

        // Custom Slider updates
        customSizeSlider.addEventListener('input', function () {
            sliderVal.textContent = this.value + ' GB';
            modelSelect.value = 'custom';
        });

        modelSelect.addEventListener('change', function () {
            if (this.value !== 'custom') {
                customSizeSlider.value = this.value;
                sliderVal.textContent = this.value + ' GB';
            }
        });

        btnLaunch.addEventListener('click', toggleSimulation);
        btnReset.addEventListener('click', resetSimulation);
    }

    function toggleSimulation() {
        if (isRunning) {
            pauseSimulation();
        } else {
            startSimulation();
        }
    }

    function startSimulation() {
        isRunning = true;
        btnLaunch.textContent = 'Pause Simulation';
        btnLaunch.classList.add('active');
        
        // Grab current configurations
        const gpuKey = gpuSelect.value;
        const cloudKey = cloudSelect.value;
        const clusterCount = parseInt(clusterSelect.value);
        const modelSize = parseFloat(customSizeSlider.value);
        
        const hwSpec = HARDWARE_SPECS[gpuKey];
        const clSpec = CLOUD_SPECS[cloudKey];

        // Renders visual topology targets
        updateTopologyColors(cloudKey);

        activeInterval = setInterval(function () {
            simulateStep(hwSpec, clSpec, clusterCount, modelSize);
        }, 3000); // Checkpoint save step every 3 seconds

        // Instant baseline first run
        simulateStep(hwSpec, clSpec, clusterCount, modelSize);
    }

    function pauseSimulation() {
        isRunning = false;
        btnLaunch.textContent = 'Resume Simulation';
        btnLaunch.classList.remove('active');
        clearInterval(activeInterval);
    }

    function resetSimulation() {
        pauseSimulation();
        btnLaunch.textContent = 'Launch Neural:IO Training';
        currentStep = 1;
        
        totalLogicalGB = 0;
        totalActualGB = 0;
        totalEgressSavedGB = 0;
        totalComputeSecondsSaved = 0;
        totalROIdollars = 0;
        totalSimulatedHours = 0;

        // Reset display
        mThroughput.textContent = '0.0';
        mDedupe.textContent = '1.0';
        mVram.textContent = '0';
        mEgress.textContent = '0.0';
        mNvme.textContent = '0.0';
        mCompute.textContent = '0:00';
        mRoi.textContent = '0.00';
        if (mSimTime) mSimTime.textContent = '0d 0h';

        standardBar.style.width = '100%';
        nioBar.style.width = '100%';

        terminalLog.innerHTML = '<div class="terminal-line"><span class="terminal-prompt">&gt;</span> Simulator idle. Select hardware and press Launch...</div>';
        
        // Reset SVG flows
        const flowPackets = document.querySelectorAll('.flow-packet');
        flowPackets.forEach(p => p.classList.remove('active'));
    }

    function updateTopologyColors(cloudKey) {
        const cloudNode = document.getElementById('svgCloudNode');
        const cloudGlow = document.getElementById('svgCloudGlow');
        const cloudLabel = document.getElementById('svgCloudLabel');
        
        if (!cloudNode) return;

        let strokeColor = '#00F2FF'; // Default Cyan
        let labelText = 'CLOUD STORAGE';

        if (cloudKey === 'aws') {
            strokeColor = '#FF9900'; // Amazon Amber
            labelText = 'AWS S3';
        } else if (cloudKey === 'r2') {
            strokeColor = '#F38020'; // Cloudflare Orange
            labelText = 'CLOUDFLARE R2';
        } else if (cloudKey === 'gcp') {
            strokeColor = '#4285F4'; // GCP Blue
            labelText = 'GOOGLE GCS';
        } else if (cloudKey === 'azure') {
            strokeColor = '#0078D4'; // Azure Blue
            labelText = 'AZURE BLOB';
        } else if (cloudKey === 'own') {
            strokeColor = '#a855f7'; // Purple
            labelText = 'LOCAL / NAS';
        }

        cloudNode.setAttribute('stroke', strokeColor);
        // Fix: svgCloudGlow is a <circle>, so we must set its fill attribute, not background.
        // We also need to add opacity since the original fill had 0.08 alpha.
        cloudGlow.setAttribute('fill', strokeColor);
        cloudGlow.setAttribute('opacity', '0.08');
        cloudLabel.textContent = labelText;
    }

    function simulateStep(hw, cloud, gpuCount, modelSize) {
        // Trigger SVG flowing animations
        animateSVGPackets();

        // 1. Calculate Deduplication metrics
        // Assume checkpoints are saved every 2 hours of training.
        // In a 4-hour step, we have 2 checkpoint save events.
        const checkpointsPerStep = 2;
        const dedupRatio = currentStep === 1 ? 1.0 : (9.0 + Math.random() * 2.8); // 9x - 11.8x deduplication
        const writtenGB = modelSize / dedupRatio;
        const avoidedGB = modelSize - writtenGB;

        // Multiply by checkpoints per step (cluster-wide parallel sharding size totals modelSize)
        totalLogicalGB += modelSize * checkpointsPerStep;
        totalActualGB += writtenGB * checkpointsPerStep;
        totalEgressSavedGB += avoidedGB * checkpointsPerStep;

        // 2. Telemetry and I/O speed details (realistic fluctuations)
        const nioBaseSpeed = hw.nioSpeed;
        const currentNioSpeed = nioBaseSpeed * (0.95 + Math.random() * 0.1); // +- 5% speed noise
        const currentBaseSpeed = hw.baseSpeed * (0.93 + Math.random() * 0.1); 

        // 3. Compute time calculation
        // Distributed sharded size per rank
        const shardSize = modelSize / gpuCount;
        
        // Multi-rank network/disk contention penalty for standard saving
        const contentionFactor = 1.0 + (gpuCount * 0.20); // 32 GPUs = 7.4x slowdown due to concurrent writes
        const standardWriteSpeed = currentBaseSpeed / contentionFactor;
        
        // Standard blocking save time per checkpoint
        const standardTimeSec = shardSize / standardWriteSpeed;
        
        // Neural:IO is fully asynchronous background streaming (blocked rank time < 100ms)
        const nioTimeSec = 0.05 + (Math.random() * 0.08); 
        
        const secondsSaved = Math.max(0, standardTimeSec - nioTimeSec) * checkpointsPerStep;
        totalComputeSecondsSaved += secondsSaved;

        // 4. Financial ROI Calculation
        // Compute Saved = saved seconds * cluster rental rate per second
        const computeSavingsUSD = (secondsSaved / 3600.0) * hw.rate * gpuCount;
        
        // Network Egress Saved = avoided GB * cloud egress rate per GB (cluster-wide parallel sharding)
        const egressSavingsUSD = avoidedGB * checkpointsPerStep * cloud.egressRate;
        
        // Storage Capacity Rent Saved = avoided GB * standard storage monthly rate, scaled down to cost per hour of active training
        const monthlyStorageSavingsUSD = avoidedGB * checkpointsPerStep * cloud.storageRate;
        const hourlyStorageSavingsUSD = monthlyStorageSavingsUSD / 720.0;
        const storageSavingsUSD = hourlyStorageSavingsUSD * SIMULATED_HOURS_PER_STEP;

        totalROIdollars += (computeSavingsUSD + egressSavingsUSD + storageSavingsUSD);

        // Increment simulated time
        totalSimulatedHours += SIMULATED_HOURS_PER_STEP;
        const days = Math.floor(totalSimulatedHours / 24);
        const hours = Math.round(totalSimulatedHours % 24);
        if (mSimTime) {
            mSimTime.textContent = `${days}d ${hours}h`;
        }

        // Update dashboard values
        mThroughput.textContent = currentNioSpeed.toFixed(1);
        
        const overallDedupe = totalLogicalGB / Math.max(0.1, totalActualGB);
        mDedupe.textContent = overallDedupe.toFixed(1);
        
        // Buffer memory displays
        const vramBuffer = Math.min(modelSize * 1024 * 0.05, hw.name.includes('5080') || hw.name.includes('4090') || hw.name.includes('5090') ? 512 : 2048);
        mVram.textContent = Math.round(vramBuffer);

        mEgress.textContent = totalEgressSavedGB.toFixed(1);
        mNvme.textContent = totalLogicalGB.toFixed(1); // 100% of standard files bypassed NVMe
        
        mCompute.textContent = formatTime(totalComputeSecondsSaved);
        mRoi.textContent = totalROIdollars.toFixed(2);

        // Standard Stall Time comparison rendering
        updateStallTimeVisuals(standardTimeSec, nioTimeSec);

        // Rolling terminal logs
        logToTerminal(currentStep, hw, cloud, gpuCount, modelSize, avoidedGB, currentNioSpeed);

        currentStep++;
    }

    function animateSVGPackets() {
        const packets = document.querySelectorAll('.flow-packet');
        packets.forEach(p => {
            p.classList.remove('active');
            void p.offsetWidth; // Trigger reflow
            p.classList.add('active');
        });
    }

    function updateStallTimeVisuals(standardSec, nioSec) {
        // Map relative bars
        const maxSec = Math.max(standardSec, 10.0);
        const standardPct = Math.max(15, (standardSec / maxSec) * 100);
        const nioPct = Math.max(2, (nioSec / maxSec) * 100);

        standardBar.style.width = standardPct + '%';
        nioBar.style.width = nioPct + '%';

        document.getElementById('sbStandardTimeTxt').textContent = standardSec.toFixed(1) + 's Stall';
        document.getElementById('sbNioTimeTxt').textContent = nioSec.toFixed(2) + 's Async';
    }

    function formatTime(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function generateHWID(gpuName) {
        const raw = "MOCK-" + gpuName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() + "-NIO9";
        return raw;
    }

    function logToTerminal(step, hw, cloud, gpus, size, avoided, speed) {
        const hwid = generateHWID(hw.name);
        const days = Math.floor(totalSimulatedHours / 24);
        const hours = Math.round(totalSimulatedHours % 24);
        const timeStr = `${days}d ${hours}h`;
        
        let lines = [];
        if (step === 1) {
            lines.push(`<span class="terminal-label yellow">[SimTime]</span> Simulated Training Started (T+0h | 4,800x Acceleration)`);
            lines.push(`<span class="terminal-label blue">[Kernel]</span> Hardware verified: <span class="white">${hw.name}</span> (${gpus}x GPUs) | HWID: <span class="cyan">${hwid}</span>`);
            lines.push(`<span class="terminal-label blue">[NeuralIO]</span> Intercepting DeepSpeed ZeRO-3 collective communication bridge`);
            lines.push(`<span class="terminal-label blue">[NeuralIO]</span> Patched Hugging Face Accelerator.save_state() successfully`);
            lines.push(`<span class="terminal-label blue">[Storage]</span> Direct-to-Cloud REST active -> ${cloud.name} | Egress: ${cloud.egressRate > 0 ? '$' + cloud.egressRate + '/GB' : '<span class="green">FREE</span>'}`);
            lines.push(`<span class="terminal-label gray">[Save]</span> Step ${step}: Writing baseline checkpoint (first run)...`);
            lines.push(`<span class="terminal-label green">[✓]</span> Baseline safe: Wrote ${size.toFixed(1)} GB to cloud in ${(size / speed).toFixed(2)}s | Effective: <span class="white">${speed.toFixed(1)} GB/s</span>`);
        } else {
            const ratio = step === 2 ? '10.2x' : (9.0 + Math.random() * 2.8).toFixed(1) + 'x';
            lines.push(`<span class="terminal-label yellow">[SimTime]</span> Advancing training clock: +4 hours (Total: ${timeStr} elapsed)`);
            lines.push(`<span class="terminal-label gray">[Save]</span> Step ${step}: fine-tuning model state...`);
            lines.push(`<span class="terminal-label blue">[NeuralIO]</span> CDC Deduplication Hit: ${ratio} duplicate chunk redundancy bypassed`);
            if (cloud.egressRate > 0) {
                lines.push(`<span class="terminal-label blue">[Network]</span> Egress Evasion: Skipped uploading ${avoided.toFixed(1)} GB of redundant layers`);
            } else {
                lines.push(`<span class="terminal-label blue">[Network]</span> Local storage/NAS write bypassed for duplicate layers`);
            }
            lines.push(`<span class="terminal-label green">[✓]</span> Saved Step ${step} in ${((size - avoided) / speed).toFixed(2)}s | 0 bytes written to NVMe SSDs`);
        }

        // Output lines to terminal UI
        lines.forEach(l => {
            const el = document.createElement('div');
            el.className = 'terminal-line';
            el.innerHTML = l;
            terminalLog.appendChild(el);
        });

        // Autoscroll
        terminalLog.scrollTop = terminalLog.scrollHeight;
    }
})();
