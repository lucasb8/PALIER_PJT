import { AssistanceRequest } from '../domain/AssistanceRequest.js';
import { Booking } from '../domain/Booking.js';
import { ExpressRequest } from '../domain/ExpressRequest.js';
import { House } from '../domain/House.js';
import { Item } from '../domain/Item.js';
import { Proposal, Vote } from '../domain/Proposal.js';
import { ReturnRequest } from '../domain/ReturnRequest.js';

export function emptyWorkspace() {
  return {
    houses: [],
    items: [],
    expressRequests: [],
    assistanceRequests: [],
    bookings: [],
    proposals: [],
    votes: [],
    returnRequests: [],
    joinRequests: [],
  };
}

export function hydrateWorkspace(raw) {
  return {
    houses: (raw.houses || []).map((house) => new House(house)),
    items: (raw.items || []).map((item) => new Item(item)),
    expressRequests: (raw.expressRequests || []).map((request) => new ExpressRequest(request)),
    assistanceRequests: (raw.assistanceRequests || []).map((request) => new AssistanceRequest(request)),
    bookings: (raw.bookings || []).map((booking) => new Booking(booking)),
    proposals: (raw.proposals || []).map((proposal) => new Proposal(proposal)),
    votes: (raw.votes || []).map((vote) => new Vote(vote)),
    returnRequests: (raw.returnRequests || []).map((request) => new ReturnRequest(request)),
    joinRequests: raw.joinRequests || [],
  };
}
