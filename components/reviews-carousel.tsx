'use client';

import { useEffect, useState } from 'react';

type Review = {
  platform: string;
  logo: string;
  url: string;
  stars: string;
  text: string;
  meta: string;
};

const reviews: Review[] = [
  {
    platform: 'Google',
    logo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png',
    url: 'https://share.google/tObyIToM9pGoNVBtV',
    stars: '★★★★★',
    text: 'When you’re looking to make any type of home improvements professionalism, punctuality, & communication are extremely important. Working with Leon’s hardwood flooring’s team has been very easy going making all my projects quick and …',
    meta: '— Fátima Ramírez (5 months ago)',
  },
  {
    platform: 'Google',
    logo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png',
    url: 'https://share.google/tObyIToM9pGoNVBtV',
    stars: '★★★★★',
    text: 'These guys were terrific! I had them install a bit of wood flooring to go with my current laminate flooring. They found a very close and complimentary color and grain, and installed it without any problems or fuss.',
    meta: '— Brad Greenquist (5 months ago)',
  },
  {
    platform: 'Google',
    logo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png',
    url: 'https://share.google/tObyIToM9pGoNVBtV',
    stars: '★★★★★',
    text: 'Great crew shows up on time and great customer service. Sanded the floors, re-stained and finish coats. Very reasonable price.',
    meta: '— Jon Jones (5 months ago)',
  },
  {
    platform: 'Google',
    logo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png',
    url: 'https://share.google/tObyIToM9pGoNVBtV',
    stars: '★★★★★',
    text: 'Leon’s Hardwood Flooring refinished my oak floors 5 years ago and they still look beautiful. They tiled my stair risers last week — fantastic!',
    meta: '— Brenda Smaller (6 months ago)',
  },
  {
    platform: 'Angi',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968875.png',
    url: 'https://www.angi.com/companylist/us/ca/los-angeles/leons-hardwood-flooring-reviews-1.htm',
    stars: '★★★★★',
    text: 'Gabriel was amazing! He helped us stay on target and made great suggestions. Always willing to redo anything if needed.',
    meta: '— Jair P. (Aug 2025) — $65,000',
  },
  {
    platform: 'Angi',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968875.png',
    url: 'https://www.angi.com/companylist/us/ca/los-angeles/leons-hardwood-flooring-reviews-1.htm',
    stars: '★★★★★',
    text: 'Highly recommend! They replaced damaged flooring, explained everything, worked clean, and left no dust behind.',
    meta: '— Sie B. (Aug 2025) — $250',
  },
  {
    platform: 'Angi',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968875.png',
    url: 'https://www.angi.com/companylist/us/ca/los-angeles/leons-hardwood-flooring-reviews-1.htm',
    stars: '★★★★★',
    text: 'Very clean, knows his work, knows his material, eye for detail, and on time.',
    meta: '— Shana R. (Aug 2025)',
  },
  {
    platform: 'Angi',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968875.png',
    url: 'https://www.angi.com/companylist/us/ca/los-angeles/leons-hardwood-flooring-reviews-1.htm',
    stars: '★★★★★',
    text: 'Very professional and the only company I use for flooring needs.',
    meta: '— George A. (Aug 2025)',
  },
  {
    platform: 'Angi',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968875.png',
    url: 'https://www.angi.com/companylist/us/ca/los-angeles/leons-hardwood-flooring-reviews-1.htm',
    stars: '★★★★★',
    text: 'Gabriel and his team were amazing! On time, neat, clean, and great work at a fair price.',
    meta: '— Brenda S. (Aug 2025) — $2,000',
  },
  {
    platform: 'Angi',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968875.png',
    url: 'https://www.angi.com/companylist/us/ca/los-angeles/leons-hardwood-flooring-reviews-1.htm',
    stars: '★★★★★',
    text: 'Splendid work! Great communication throughout the project.',
    meta: '— Daniel C. (Aug 2025) — $34,000',
  },
  {
    platform: 'HomeAdvisor',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968875.png',
    url: 'https://www.homeadvisor.com/rated.gabeshardwoodflooring.66425101.html',
    stars: '★★★★★',
    text: 'Gabriel was amazing! Same review as Angi but listed separately for HomeAdvisor.',
    meta: '— Jair P. (HomeAdvisor)',
  },
  {
    platform: 'Yelp',
    logo: 'https://cdn-icons-png.flaticon.com/512/174/174857.png',
    url: 'https://www.yelp.com/biz/leon-s-hardwood-flooring-san-fernando',
    stars: '★★★★★',
    text: 'He does the best hardwood floors and is very hardworking and professional. Highly recommend.',
    meta: '— Viridiana A. (Jul 30, 2025)',
  },
];

export default function ReviewsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) return;

    const interval = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % reviews.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, []);

  const review = reviews[index];

  return (
    <div className="mx-auto w-full max-w-[900px] p-4 sm:p-5 font-sans">
      <div className="mb-6 flex items-center gap-4 rounded-full bg-gradient-to-br from-[#111] to-[#333] px-5 py-4 text-white">
        <div className="flex flex-col items-center border-r border-white/20 pr-4">
          <span className="text-[26px] font-bold leading-none">5.0</span>
          <span className="text-[16px] text-[#f7b500]">★★★★★</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-base font-semibold">12 Verified Reviews</div>
          <div className="text-sm text-white/90">Google · Yelp · Angi · HomeAdvisor</div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="rounded-[14px] border border-black/5 bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <img
                src={review.logo}
                alt={`${review.platform} logo`}
                className="h-[26px] w-[26px] rounded-full object-contain"
              />
              <span className="text-[15px] font-semibold text-[#111]">
                {review.platform} Review
              </span>
            </div>

            <a
              href={review.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#0073ff] hover:underline"
            >
              View
            </a>
          </div>

          <div className="my-2.5 text-[20px] text-[#f7b500]">{review.stars}</div>

          <p className="mb-2.5 text-[15px] leading-[1.55] text-[#222] sm:text-[17px]">
            “{review.text}”
          </p>

          <div className="text-sm text-[#777]">{review.meta}</div>
        </div>
      </div>
    </div>
  );
}