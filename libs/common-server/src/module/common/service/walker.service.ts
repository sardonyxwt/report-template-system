import { Inject, Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { ReflectableDecorator } from '@nestjs/core/services/reflector.service';

export type Scope = 'all' | 'controllers' | 'providers';

export type ClassDiscoveryOptions<CParam = unknown> =
  | {
      scope?: Scope;
    }
  | {
      scope?: Scope;
      decorator: ReflectableDecorator<CParam> | string;
      decoratorPredicate?: (value: CParam) => boolean;
    };

export type MethodDiscoveryOptions<CParam, MParam> =
  ClassDiscoveryOptions<CParam> &
    (
      | {
          methodDecorator: ReflectableDecorator<MParam> | string;
          methodDecoratorPredicate?: (value: MParam) => boolean;
        }
      | Record<string, never>
    );

/**
 * Discovery helper for runtime metadata-driven features.
 *
 * This service wraps Nest discovery APIs to find controller/provider instances
 * and methods by custom Reflector decorators.
 */
@Injectable()
export class WalkerService {
  constructor(
    @Inject(DiscoveryService)
    private readonly discoveryService: DiscoveryService,
    @Inject(MetadataScanner)
    private readonly metadataScanner: MetadataScanner,
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {}

  /**
   * Reads decorator metadata from a list of class or method targets.
   */
  findMetadataOf<T>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    targets: Function[],
    decorator: ReflectableDecorator<T> | string,
  ): T[] {
    const metadata = [];

    for (const target of targets) {
      const meta = this.reflector.get(decorator, target);

      if (meta) {
        metadata.push(meta);
      }
    }

    return metadata;
  }

  /**
   * Finds methods whose owning class and method metadata match the supplied
   * filters.
   */
  findMethodsBy<CParam, MParam>(
    options: MethodDiscoveryOptions<CParam, MParam> = {},
  ) {
    const classes = this.findClassesBy({
      scope: options.scope,
      decorator: 'decorator' in options ? options.decorator : undefined,
      decoratorPredicate:
        'decoratorPredicate' in options
          ? options.decoratorPredicate
          : undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const methods: Function[] = [];

    for (const instance of classes) {
      const methodKeys = this.metadataScanner.getAllMethodNames(instance);

      for (const methodKey of methodKeys) {
        const method = instance[methodKey];

        if ('methodDecorator' in options && options.methodDecorator) {
          const metadata = this.reflector.get(options.methodDecorator, method);

          if (
            !metadata ||
            (options.methodDecoratorPredicate &&
              !options.methodDecoratorPredicate(metadata))
          ) {
            continue;
          }
        }

        methods.push(method);
      }
    }

    return methods;
  }

  /**
   * Finds instantiated providers/controllers matching optional class metadata.
   */
  findClassesBy<CParam>(options: ClassDiscoveryOptions<CParam> = {}) {
    const wrappers = [];

    switch (options.scope) {
      case 'all':
        wrappers.push(...this.discoveryService.getProviders());
        wrappers.push(...this.discoveryService.getControllers());
        break;
      case 'providers':
        wrappers.push(...this.discoveryService.getProviders());
        break;
      case 'controllers':
        wrappers.push(...this.discoveryService.getControllers());
        break;
    }

    const classes = [];

    for (const wrapper of wrappers) {
      const { instance } = wrapper;

      const prototype = instance && Object.getPrototypeOf(instance);

      if (!instance || !prototype) {
        continue;
      }

      if ('decorator' in options && options.decorator) {
        const metadata = this.reflector.get(
          options.decorator,
          instance.constructor,
        );

        if (
          !metadata ||
          (options.decoratorPredicate && !options.decoratorPredicate(metadata))
        ) {
          continue;
        }
      }

      classes.push(instance);
    }

    return classes;
  }
}
