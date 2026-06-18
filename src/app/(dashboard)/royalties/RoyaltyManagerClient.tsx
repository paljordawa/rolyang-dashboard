// src/app/(dashboard)/royalties/RoyaltyManagerClient.tsx
"use client";

import React, { useState } from 'react';
import { DollarSign, Landmark, TrendingUp, History, UserCheck, Play, ArrowUpRight, Loader2, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createRoyaltyPaymentAction, markRoyaltyPaidAction } from '@/app/actions';

interface Artist {
  id: string;
  name: string;
  image_url?: string;
  followers?: string;
}

interface Payment {
  id: string;
  artist_id: string;
  amount: number;
  status: 'pending' | 'paid';
  period_start: string;
  period_end: string;
  stream_count: number;
  payout_date?: string | null;
  created_at: string;
}

interface Track {
  id: string;
  title: string;
  artist_id: string;
}

interface PlayRecord {
  id: string;
  track_id: string;
  played_at: string;
}

interface RoyaltyManagerClientProps {
  initialArtists: Artist[];
  initialPayments: Payment[];
  allTracks: Track[];
  allPlays: PlayRecord[];
}

const STREAM_RATE = 0.005; // $0.005 per stream

export default function RoyaltyManagerClient({
  initialArtists,
  initialPayments,
  allTracks,
  allPlays
}: RoyaltyManagerClientProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Payout form state
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [payoutStreams, setPayoutStreams] = useState(0);
  const [periodStart, setPeriodStart] = useState('2026-05-01');
  const [periodEnd, setPeriodEnd] = useState('2026-05-31');

  // Map tracks to artists
  const trackArtistMap = React.useMemo(() => {
    const map = new Map<string, string>();
    allTracks.forEach(t => map.set(t.id, t.artist_id));
    return map;
  }, [allTracks]);

  // Map artist ID to details
  const artistMap = React.useMemo(() => {
    const map = new Map<string, Artist>();
    initialArtists.forEach(a => map.set(a.id, a));
    return map;
  }, [initialArtists]);

  // Calculate live plays per artist (with mock fallbacks if database is empty)
  const artistStats = React.useMemo(() => {
    const statsMap = new Map<string, { streams: number; earnings: number; paid: number }>();
    
    // Initialize
    initialArtists.forEach(a => {
      // Provide realistic initial mock counts if database plays are empty
      let mockStreams = 0;
      if (allPlays.length === 0) {
        if (a.id === 'anu') mockStreams = 142800;
        else if (a.id === 'tsering-gyurmay') mockStreams = 98500;
        else if (a.id === 'tenzin-choesang-norbu-choephel-and-tsering-paljor') mockStreams = 54100;
        else mockStreams = 12000;
      }
      statsMap.set(a.id, {
        streams: mockStreams,
        earnings: mockStreams * STREAM_RATE,
        paid: 0
      });
    });

    // Populate actual DB plays if any exist
    allPlays.forEach(play => {
      const artistId = trackArtistMap.get(play.track_id);
      if (artistId && statsMap.has(artistId)) {
        const current = statsMap.get(artistId)!;
        current.streams += 1;
        current.earnings = current.streams * STREAM_RATE;
      }
    });

    // Calculate processed payments (paid)
    payments.forEach(payment => {
      if (payment.status === 'paid' && statsMap.has(payment.artist_id)) {
        const current = statsMap.get(payment.artist_id)!;
        current.paid += Number(payment.amount);
      }
    });

    return statsMap;
  }, [initialArtists, allPlays, payments, trackArtistMap]);

  // Overview metrics
  const totalStreams = Array.from(artistStats.values()).reduce((sum, item) => sum + item.streams, 0);
  const totalProcessedPayouts = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, item) => sum + Number(item.amount), 0);
  
  const totalPendingBalance = Array.from(artistStats.values()).reduce((sum, item) => {
    const unpaid = item.earnings - item.paid;
    return sum + (unpaid > 0 ? unpaid : 0);
  }, 0);

  // Trigger payout modal
  const openPayoutModal = (artist: Artist) => {
    const stats = artistStats.get(artist.id) || { streams: 0, earnings: 0, paid: 0 };
    const unpaid = stats.earnings - stats.paid;
    
    setSelectedArtist(artist);
    setPayoutAmount(Math.max(0, Math.round(unpaid * 100) / 100));
    setPayoutStreams(Math.max(0, stats.streams));
    setIsModalOpen(true);
  };

  // Submit payout processing
  const handleProcessPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtist || payoutAmount <= 0) return;

    try {
      setIsProcessing(true);
      const payoutData = {
        artist_id: selectedArtist.id,
        amount: payoutAmount,
        status: 'paid' as const,
        period_start: periodStart,
        period_end: periodEnd,
        stream_count: payoutStreams,
        payout_date: new Date().toISOString()
      };

      await createRoyaltyPaymentAction(payoutData);
      
      // Update local state
      const mockPaymentRecord: Payment = {
        id: `pay-${Date.now()}`,
        ...payoutData,
        created_at: new Date().toISOString()
      };
      setPayments(prev => [mockPaymentRecord, ...prev]);
      
      setIsModalOpen(false);
      alert(`Payout of $${payoutAmount.toFixed(2)} successfully logged for ${selectedArtist.name}!`);
    } catch (err: any) {
      alert(`Error recording payout: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Mark pending payment as paid
  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      setIsProcessing(true);
      await markRoyaltyPaidAction(paymentId);
      setPayments(prev => prev.map(p => {
        if (p.id === paymentId) {
          return { ...p, status: 'paid', payout_date: new Date().toISOString() };
        }
        return p;
      }));
      alert('Payment marked as paid.');
    } catch (err: any) {
      alert(`Error updating payment: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110" />
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              Total streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-mono">{totalStreams.toLocaleString()}</div>
            <p className="text-xs text-zinc-500 mt-1">Aggregated catalog track counts</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110" />
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Royalties Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-mono">${totalProcessedPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">Processed bank & cash ledger totals</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110" />
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Pending Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-mono">${totalPendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">Accumulated unpaid streaming earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Ledger Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left pane: Artist ledger table */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-white">Artist Earnings Ledger</CardTitle>
              <CardDescription className="text-zinc-400">Stream play earnings based on custom rate of ${STREAM_RATE} per play</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Artist</th>
                      <th className="py-3 px-4">Total Streams</th>
                      <th className="py-3 px-4">Total Earning</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Pending Payout</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {initialArtists.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No artists found in the catalog.
                        </td>
                      </tr>
                    ) : (
                      initialArtists.map((artist) => {
                        const stats = artistStats.get(artist.id) || { streams: 0, earnings: 0, paid: 0 };
                        const unpaid = stats.earnings - stats.paid;
                        
                        return (
                          <tr key={artist.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                                {artist.image_url ? (
                                  <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-violet-600 to-fuchsia-600 uppercase">
                                    {artist.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <span className="font-semibold text-white truncate max-w-[150px]">{artist.name}</span>
                            </td>
                            <td className="py-4 px-4 font-mono text-zinc-300">{stats.streams.toLocaleString()}</td>
                            <td className="py-4 px-4 font-mono text-zinc-300">${stats.earnings.toFixed(2)}</td>
                            <td className="py-4 px-4 font-mono text-emerald-400">${stats.paid.toFixed(2)}</td>
                            <td className="py-4 px-4 font-mono font-bold text-amber-300">${unpaid > 0 ? unpaid.toFixed(2) : '0.00'}</td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                size="sm"
                                onClick={() => openPayoutModal(artist)}
                                className="bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg cursor-pointer inline-flex items-center gap-1"
                              >
                                Payout
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right pane: Transaction history log */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg text-white">Disbursement Logs</CardTitle>
                <CardDescription className="text-zinc-400">Past payment logs</CardDescription>
              </div>
              <History className="w-5 h-5 text-zinc-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[450px] overflow-y-auto pr-1">
                {payments.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-sm">
                    No disbursement transactions recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {payments.map((p) => {
                      const artist = artistMap.get(p.artist_id);
                      const artistName = artist ? artist.name : 'Unknown Artist';
                      const formattedDate = p.payout_date 
                        ? new Date(p.payout_date).toLocaleDateString()
                        : new Date(p.created_at).toLocaleDateString();

                      return (
                        <div key={p.id} className="p-4 flex flex-col gap-1.5 hover:bg-white/5 transition-colors">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-white text-sm truncate max-w-[140px]">{artistName}</span>
                            <span className="font-mono font-bold text-emerald-400 text-sm">${Number(p.amount).toFixed(2)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formattedDate}
                            </span>
                            <span className="font-mono text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                              {p.stream_count.toLocaleString()} plays
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs pt-1">
                            <span className="text-[10px] text-zinc-500">Period: {p.period_start} to {p.period_end}</span>
                            {p.status === 'paid' ? (
                              <span className="text-[10px] font-semibold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md">Paid</span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-md">Pending</span>
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(p.id)}
                                  className="h-6 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 font-semibold cursor-pointer"
                                >
                                  Mark Paid
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PROCESS PAYOUT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-900 border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Log Royalty Disbursement</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Record a bank transfer, wire, or cash payment to the artist's accounts.
            </DialogDescription>
          </DialogHeader>

          {selectedArtist && (
            <form onSubmit={handleProcessPayoutSubmit} className="space-y-4 py-4">
              <div className="p-3.5 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                  {selectedArtist.image_url ? (
                    <img src={selectedArtist.image_url} alt={selectedArtist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-violet-600 to-fuchsia-600 uppercase">
                      {selectedArtist.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{selectedArtist.name}</h4>
                  <p className="text-xs text-violet-300">Unpaid Streams: {payoutStreams.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pay-amount" className="text-zinc-300">Amount (USD)</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="bg-zinc-950/40 border-white/10 text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-streams" className="text-zinc-300">Stream Count</Label>
                  <Input
                    id="pay-streams"
                    type="number"
                    required
                    value={payoutStreams}
                    onChange={(e) => setPayoutStreams(Number(e.target.value))}
                    className="bg-zinc-950/40 border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-zinc-300">Period Start</Label>
                  <Input
                    id="start-date"
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="bg-zinc-950/40 border-white/10 text-white text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-zinc-300">Period End</Label>
                  <Input
                    id="end-date"
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="bg-zinc-950/40 border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm & Process
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
