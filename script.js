// 工具提示功能
const tooltip = document.getElementById('tooltip');
const nodes = document.querySelectorAll('.node');

// 格式化工具提示内容
function formatTooltip(text) {
    // 查找所有"标题："的位置
    const titleMatches = [];
    const titlePattern = /([^：:。.]+)[：:]/g;
    let titleMatch;
    
    while ((titleMatch = titlePattern.exec(text)) !== null) {
        const title = titleMatch[1].trim();
        // 如果标题长度合理（小于30字符），认为是有效的section标题
        if (title.length < 30) {
            titleMatches.push({
                title: title,
                startIndex: titleMatch.index,
                endIndex: titleMatch.index + titleMatch[0].length
            });
        }
    }
    
    // 如果有多个标题，按标题分割内容
    if (titleMatches.length > 0) {
        const sections = [];
        titleMatches.forEach((titleInfo, index) => {
            const start = titleInfo.endIndex;
            const end = index < titleMatches.length - 1 
                ? titleMatches[index + 1].startIndex 
                : text.length;
            let content = text.substring(start, end).trim();
            
            // 移除末尾的句号（如果有），因为会在显示时添加
            content = content.replace(/[。.]$/, '');
            
            if (content.length > 0) {
                sections.push({
                    title: titleInfo.title,
                    content: content
                });
            }
        });
        
        // 如果有多个section，格式化显示
        if (sections.length > 1) {
            let html = '';
            sections.forEach((section, index) => {
                const isLast = index === sections.length - 1;
                html += `<div class="tooltip-section" ${isLast ? 'style="border-bottom: none; padding-bottom: 0; margin-bottom: 0;"' : ''}>
                    <div class="tooltip-title">${section.title}</div>
                    <div class="tooltip-text">${section.content}。</div>
                </div>`;
            });
            return html;
        }
        
        // 如果只有一个section，也格式化显示
        if (sections.length === 1) {
            return `<div class="tooltip-section" style="border-bottom: none; padding-bottom: 0; margin-bottom: 0;">
                <div class="tooltip-title">${sections[0].title}</div>
                <div class="tooltip-text">${sections[0].content}。</div>
            </div>`;
        }
    }
    
    // 如果没有匹配到section模式，按句号分割并格式化
    const sentences = text.split(/[。.]/).filter(s => s.trim());
    if (sentences.length > 1) {
        return `<div class="tooltip-content">${sentences.join('。<br>')}。</div>`;
    }
    
    // 最后兜底：直接显示
    return `<div class="tooltip-content">${text}</div>`;
}

// 从localStorage加载进度和备注
function loadProgressAndNotes() {
    nodes.forEach((node, index) => {
        const id = index + 1;
        const slider = node.querySelector('.progress-slider');
        const progressValue = node.querySelector('.progress-value');
        const noteInput = node.querySelector('.note-input');
        
        // 加载进度
        const savedProgress = localStorage.getItem(`progress-${id}`);
        if (savedProgress !== null) {
            slider.value = savedProgress;
            progressValue.textContent = savedProgress + '%';
            updateProgressStyle(slider, savedProgress);
        }
        
        // 加载备注
        const savedNote = localStorage.getItem(`note-${id}`);
        if (savedNote !== null) {
            noteInput.value = savedNote;
        }
    });
}

// 更新进度条样式
function updateProgressStyle(slider, value) {
    const percentage = value;
    const nodeContent = slider.closest('.node-content');
    
    // 根据进度更新背景色
    if (percentage >= 100) {
        nodeContent.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
        nodeContent.style.borderColor = '#10b981';
    } else if (percentage >= 50) {
        nodeContent.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
        nodeContent.style.borderColor = '#f59e0b';
    } else if (percentage > 0) {
        nodeContent.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
        nodeContent.style.borderColor = '#3b82f6';
    } else {
        nodeContent.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
        nodeContent.style.borderColor = 'transparent';
    }
}

// 初始化加载状态
loadProgressAndNotes();

// 音效函数
function playHoverSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // 如果浏览器不支持Web Audio API，静默失败
    }
}

function playSliderSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    } catch (e) {
        // 如果浏览器不支持Web Audio API，静默失败
    }
}

// 更新工具提示位置
function updateTooltipPosition(nodeContent, tooltip, mouseY) {
    const rect = nodeContent.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // 默认显示在右侧，距离节点10px
    let left = rect.right + 10;
    
    // 如果右侧空间不足，显示在左侧
    if (left + tooltipRect.width > window.innerWidth - 20) {
        left = rect.left - tooltipRect.width - 10;
    }
    
    // 垂直位置：尽量与节点对齐，如果鼠标位置可用则跟随鼠标
    let top;
    if (mouseY !== undefined) {
        top = mouseY - tooltipRect.height / 2;
    } else {
        top = rect.top;
    }
    
    // 确保不超出视口
    if (top < 10) {
        top = 10;
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
        top = window.innerHeight - tooltipRect.height - 10;
    }
    
    // 如果tooltip在节点上方，尽量与节点顶部对齐
    if (top + tooltipRect.height < rect.top) {
        top = rect.top;
    }
    // 如果tooltip在节点下方，尽量与节点底部对齐
    if (top > rect.bottom) {
        top = rect.bottom - tooltipRect.height;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

// 为每个节点添加鼠标悬停事件
nodes.forEach(node => {
    const nodeContent = node.querySelector('.node-content');
    const tooltipText = node.getAttribute('data-tooltip');
    
    if (tooltipText) {
        nodeContent.addEventListener('mouseenter', (e) => {
            // 播放悬停音效
            playHoverSound();
            
            tooltip.innerHTML = formatTooltip(tooltipText);
            tooltip.style.visibility = 'hidden';
            tooltip.style.display = 'block';
            tooltip.classList.add('show');
            
            // 等待一帧，让浏览器渲染tooltip，然后获取尺寸
            requestAnimationFrame(() => {
                updateTooltipPosition(nodeContent, tooltip, e.clientY);
                tooltip.style.visibility = 'visible';
            });
        });
        
        nodeContent.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
            tooltip.style.visibility = 'hidden';
        });
        
        nodeContent.addEventListener('mousemove', (e) => {
            if (tooltip.classList.contains('show')) {
                updateTooltipPosition(nodeContent, tooltip, e.clientY);
            }
        });
    }
});

// 为每个进度条添加事件
document.querySelectorAll('.progress-slider').forEach((slider, index) => {
    const id = index + 1;
    const progressValue = document.getElementById(`progress-value-${id}`);
    
    // 输入事件（拖动时实时更新）
    let lastPlayTime = 0;
    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        progressValue.textContent = value + '%';
        updateProgressStyle(slider, value);
        
        // 播放音效（节流，避免太频繁）
        const now = Date.now();
        if (now - lastPlayTime > 50) {
            playSliderSound();
            lastPlayTime = now;
        }
    });
    
    // 改变事件（释放时保存）
    slider.addEventListener('change', (e) => {
        const value = e.target.value;
        localStorage.setItem(`progress-${id}`, value);
        
        // 添加视觉反馈
        const nodeContent = slider.closest('.node-content');
        nodeContent.style.transform = 'scale(1.02)';
        setTimeout(() => {
            nodeContent.style.transform = '';
        }, 200);
    });
    
    // 初始化样式
    updateProgressStyle(slider, slider.value);
});

// 为每个备注输入框添加事件
document.querySelectorAll('.note-input').forEach((noteInput, index) => {
    const id = index + 1;
    
    // 失去焦点时保存
    noteInput.addEventListener('blur', (e) => {
        localStorage.setItem(`note-${id}`, e.target.value);
    });
    
    // 也可以实时保存（可选，如果觉得太频繁可以注释掉）
    noteInput.addEventListener('input', (e) => {
        // 使用防抖，避免频繁保存
        clearTimeout(noteInput.saveTimeout);
        noteInput.saveTimeout = setTimeout(() => {
            localStorage.setItem(`note-${id}`, e.target.value);
        }, 500);
    });
});
