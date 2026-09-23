import { useEffect, useState } from 'react';

const FloatingDigitTracker = ({ symbol, subscribeQuotes }: { symbol: string; subscribeQuotes: any }) => {
    const [counts, setCounts] = useState<number[]>(Array(10).fill(0));
    const [tickLimit, setTickLimit] = useState(100);
    const [lastDigit, setLastDigit] = useState<number | null>(null);
    const [touches, setTouches] = useState(0);

    useEffect(() => {
        setCounts(Array(10).fill(0));
        setLastDigit(null);
        setTouches(0);
        let unsubscribe = () => {};
        try {
            unsubscribe = subscribeQuotes({ symbol, granularity: 0 }, (quote: any) => {
                const value = Number(quote?.quote ?? quote?.price ?? quote);
                if (!Number.isFinite(value)) return;
                const digit = Number(String(value).replace(/\\D/g, '').slice(-1));
                if (!Number.isInteger(digit)) return;
                setLastDigit(digit);
                setTouches(current => current + 1);
                setCounts(current => current.map((count, index) => index === digit ? count + 1 : count));
            });
        } catch { /* Keep the tracker visible if the live stream is unavailable. */ }
        return () => unsubscribe();
    }, [subscribeQuotes, symbol]);

    const total = counts.reduce((sum, count) => sum + count, 0);
    const ranked = [...counts].map((count, digit) => ({ count, digit })).sort((a, b) => b.count - a.count);
    const rankByDigit = new Map(ranked.map((entry, rank) => [entry.digit, rank]));
    const toneFor = (digit: number) => {
        const rank = rankByDigit.get(digit);
        if (rank === 0) return 'tracker-digit--highest';
        if (rank === 9) return 'tracker-digit--lowest';
        if (rank === 1) return 'tracker-digit--second';
        if (rank === 2) return 'tracker-digit--third';
        return '';
    };

    return <section className='floating-digit-tracker' aria-label={`Live digit movement for ${symbol}`}>
        <div className='floating-digit-tracker__digits'>{counts.map((count, digit) => <div key={digit} className={`tracker-digit ${toneFor(digit)} ${lastDigit === digit ? 'tracker-digit--touched' : ''}`}><strong>{digit}</strong><span>{total ? Math.round((count / total) * 100) : 0}%</span>{lastDigit === digit && <i aria-label={`Digit ${digit} touched`}>▲</i>}</div>)}</div>
        <label className='floating-digit-tracker__select'><select value={tickLimit} onChange={event => setTickLimit(Number(event.target.value))}><option value={100}>100 Ticks</option><option value={250}>250 Ticks</option><option value={500}>500 Ticks</option></select><span>⌄</span></label>
        <small className='floating-digit-tracker__status'>{touches ? `${touches} live ticks` : 'Waiting for live ticks'}</small>
    </section>;
};
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
/* [AI] - Analytics removed - rudderstack event tracking removed */
/* [/AI] */
import ChunkLoader from '@/components/loader/chunk-loader';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import { useSmartChartAdaptor } from '@/hooks/useSmartChartAdaptor';
import { useStore } from '@/hooks/useStore';
import { ChartTitle, SmartChart, TGranularity, TStateChangeListener } from '@deriv-com/smartcharts-champion';
import { useDevice } from '@deriv-com/ui';
import ToolbarWidgets from './toolbar-widgets';
import '@deriv-com/smartcharts-champion/dist/smartcharts.css';

const Chart = observer(({ show_digits_stats }: { show_digits_stats: boolean }) => {
    const barriers: [] = [];
    const { common, ui } = useStore();
    const { chart_store, run_panel, dashboard } = useStore();
    const [isSafari, setIsSafari] = useState(false);

    const {
        chart_type,
        getMarketsOrder,
        granularity,
        onSymbolChange,
        setChartStatus,
        symbol,
        updateChartType,
        updateGranularity,
        updateSymbol,
    } = chart_store;

    // Use the custom hook for SmartChart Adaptor
    const { chartData, getQuotes, subscribeQuotes, unsubscribeQuotes } = useSmartChartAdaptor();

    const { isDesktop, isMobile } = useDevice();
    const { is_drawer_open } = run_panel;
    const { is_chart_modal_visible } = dashboard;

    const settings = {
        assetInformation: false, // ui.is_chart_asset_info_visible,
        countdown: true,
        isHighestLowestMarkerEnabled: false, // TODO: Pending UI,
        language: common.current_language.toLowerCase(),
        position: ui.is_chart_layout_default ? 'bottom' : 'left',
        theme: ui.is_dark_mode_on ? 'dark' : 'light',
    };

    useEffect(() => {
        // Safari browser detection using feature detection
        // More robust than user agent sniffing
        const isSafariBrowser = () => {
            // Check for Safari-specific features
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            // Additional check: Safari has specific webkit features
            const hasWebkitFeatures = 'webkitAudioContext' in window || 'WebKitMediaSource' in window;

            return isSafari && hasWebkitFeatures;
        };

        setIsSafari(isSafariBrowser());

        return () => {
            chart_api.api.forgetAll('ticks');
        };
    }, []);

    useEffect(() => {
        if (!symbol) updateSymbol();
    }, [symbol, updateSymbol]);

    const is_connection_opened = !!chart_api?.api;

    const handleStateChange: TStateChangeListener = (state, options) => {
        /* [AI] - Analytics removed - rudderstack event call removed */
        // Handle state changes: INITIAL, READY, SCROLL_TO_LEFT
        /* [/AI] */
        if (state === 'READY') {
            setChartStatus(true);
        }
    };

    if (!symbol || chartData.activeSymbols.length === 0) {
        return <ChunkLoader message='' />;
    }

    return (
        <div
            className={classNames('dashboard__chart-wrapper', {
                'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
                'dashboard__chart-wrapper--safari': isSafari,
            })}
            dir='ltr'
        >
            <FloatingDigitTracker symbol={symbol} subscribeQuotes={subscribeQuotes} />
            <SmartChart
                id={`dbot-${symbol}`}
                key={`chart-${symbol}`}
                barriers={barriers}
                showLastDigitStats={show_digits_stats}
                chartControlsWidgets={null}
                enabledChartFooter={false}
                stateChangeListener={handleStateChange}
                toolbarWidget={() => (
                    <ToolbarWidgets
                        updateChartType={updateChartType}
                        updateGranularity={updateGranularity}
                        position={!isDesktop ? 'bottom' : 'top'}
                        isDesktop={isDesktop}
                    />
                )}
                chartType={chart_type}
                isMobile={isMobile}
                enabledNavigationWidget={isDesktop}
                granularity={granularity as TGranularity}
                getQuotes={getQuotes}
                subscribeQuotes={subscribeQuotes}
                unsubscribeQuotes={unsubscribeQuotes}
                chartData={{ activeSymbols: chartData.activeSymbols, tradingTimes: chartData.tradingTimes }}
                settings={settings}
                symbol={symbol}
                topWidgets={() => <ChartTitle onChange={onSymbolChange} />}
                isConnectionOpened={is_connection_opened}
                getMarketsOrder={getMarketsOrder}
                isLive
                leftMargin={80}
                drawingToolFloatingMenuPosition={isMobile ? { x: 100, y: 100 } : { x: 200, y: 200 }}
            />
        </div>
    );
});

export default Chart;
