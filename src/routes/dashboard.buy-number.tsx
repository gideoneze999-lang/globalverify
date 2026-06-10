import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  fetchTwilioSupportedCountries, 
  searchAvailableTwilioNumbers, 
  addTwilioNumber,
  getMessagingPricing
} from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Phone, Search, Globe, ChevronRight, Hash, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatNGN } from "@/lib/format";
import { provisionTwilioNumber } from "@/lib/messaging.functions";


export const Route = createFileRoute("/dashboard/buy-number")({ component: BuyNumberPage });

function BuyNumberPage() {
  const [country, setCountry] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<any>(null);

  const countriesFn = useServerFn(fetchTwilioSupportedCountries);
  const searchFn = useServerFn(searchAvailableTwilioNumbers);
  const addFn = useServerFn(addTwilioNumber);
  const pricingFn = useServerFn(getMessagingPricing);

  const { data: countries, isLoading: loadingCountries } = useQuery({
    queryKey: ["twilioCountries"],
    queryFn: () => countriesFn(),
  });

  const { data: pricing } = useQuery({
    queryKey: ["msgPricing"],
    queryFn: () => pricingFn(),
  });

  const { data: availableNumbers, isFetching: searchingNumbers, error: searchError } = useQuery({
    queryKey: ["availableTwilioNumbers", country, areaCode],
    queryFn: () => searchFn({ data: { country_iso2: country, areaCode: areaCode || undefined } }),
    enabled: !!country,
  });

  const purchaseMutation = useMutation({
    mutationFn: (num: any) => addFn({ 
      data: { 
        phone_e164: num.phone_number, 
        country_iso2: num.iso_country,
        label: `Twilio ${num.iso_country}`
      } 
    }),
    onSuccess: () => {
      toast.success("Phone number successfully provisioned and added to your pool!");
      setSelectedPhone(null);
      // In a real app, we'd also handle the Twilio charge here
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gradient flex items-center gap-3">
          <Globe className="w-8 h-8" /> Provision Twilio Number
        </h1>
        <p className="text-muted-foreground mt-2">
          Dynamically browse and purchase dedicated Twilio numbers for your messaging campaigns.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Search className="w-4 h-4" /> Filter Search
            </h2>
            
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Country</label>
              <Select value={country} onValueChange={(val) => { setCountry(val); setSelectedPhone(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCountries ? "Loading countries..." : "Choose a country"} />
                </SelectTrigger>
                <SelectContent>
                  {(countries ?? []).map((c: any) => (
                    <SelectItem key={c.iso2} value={c.iso2}>
                      {c.name} ({c.iso2})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Area Code (Optional)</label>
              <Input 
                placeholder="e.g. 415" 
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                maxLength={5}
              />
            </div>

            <div className="pt-2">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Estimated Cost</div>
                <div className="text-2xl font-display text-gradient">{formatNGN(5000)} <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Price includes Twilio provisioning and local regulatory compliance fees.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold mb-4 flex items-center justify-between">
              <span>Available Numbers</span>
              {searchingNumbers && <div className="text-xs font-normal text-muted-foreground animate-pulse">Searching Twilio inventory...</div>}
            </h2>

            {!country && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">No Country Selected</h3>
                  <p className="text-sm text-muted-foreground">Select a country to browse real-time inventory.</p>
                </div>
              </div>
            )}

            {country && (
              <div className="space-y-3">
                {searchError && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{(searchError as Error).message}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                  {(availableNumbers ?? []).map((num: any) => (
                    <div 
                      key={num.phone_number}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer group relative",
                        selectedPhone?.phone_number === num.phone_number
                          ? "bg-primary/10 border-primary shadow-lg ring-1 ring-primary"
                          : "bg-background/40 border-border/50 hover:border-primary/50 hover:bg-muted/30"
                      )}
                      onClick={() => setSelectedPhone(num)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-mono text-lg font-bold group-hover:text-primary transition-colors">
                          {num.friendly_name}
                        </div>
                        {selectedPhone?.phone_number === num.phone_number && (
                          <Badge className="bg-primary text-primary-foreground">Selected</Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mb-3">
                        {num.capabilities?.SMS && <Badge variant="outline" className="text-[10px] h-5">SMS</Badge>}
                        {num.capabilities?.voice && <Badge variant="outline" className="text-[10px] h-5">Voice</Badge>}
                        {num.capabilities?.MMS && <Badge variant="outline" className="text-[10px] h-5">MMS</Badge>}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Provisioning Instant</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                  {country && !searchingNumbers && availableNumbers?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground italic">
                      No matching numbers found in this region.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedPhone && (
            <div className="glass rounded-2xl p-6 border-primary/30 bg-primary/5 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Hash className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Confirm Provisioning</h3>
                    <p className="text-sm text-muted-foreground">You are purchasing {selectedPhone.phone_number}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedPhone(null)}>Cancel</Button>
                  <Button 
                    className="gradient-primary" 
                    disabled={purchaseMutation.isPending}
                    onClick={() => purchaseMutation.mutate(selectedPhone)}
                  >
                    {purchaseMutation.isPending ? "Provisioning..." : "Buy Now"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
